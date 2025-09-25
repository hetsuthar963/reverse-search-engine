import { fetchImageAsBase64 } from './services/fetchImage.js';
import { extractText } from './services/mistral.js';
import { describeImage } from './services/gemini.js';
import { reverseImageSearch, searchByQueries } from './services/serper.js';
import { buildSearchPlan, extractEntities } from './utils/queryBuilder.js';
import { buildReport } from './report.js';
import { log } from './utils/logger.js';
import { measure } from './utils/timing.js';

export const runReverseSearch = async (imageUrl) => {
  const startedAt = Date.now();

  const fetchTiming = await measure('fetchImage', () => fetchImageAsBase64(imageUrl), { logger: log });
  if (fetchTiming.error) throw fetchTiming.error;
  const { base64, mimeType } = fetchTiming.result;

  const [ocrTiming, visionTiming] = await Promise.all([
    measure('mistralOCR', () => extractText(base64, mimeType), { logger: log }),
    measure('geminiVision', () => describeImage(base64, mimeType), { logger: log })
  ]);

  if (ocrTiming.error) {
    log.error('OCR measurement failed', { message: ocrTiming.error.message });
  }
  if (visionTiming.error) {
    log.error('Vision measurement failed', { message: visionTiming.error.message });
  }

  const ocr = ocrTiming.result || { text: '', error: ocrTiming.error?.message }; 
  const vision = visionTiming.result || { description: '', error: visionTiming.error?.message };

  const entities = extractEntities({ ocrText: ocr.text, visionDescription: vision.description });

  const searchPlan = buildSearchPlan({
    imageUrl,
    ocr: { textPreview: ocr.text },
    vision,
    entities,
    documentType: entities.documentType
  });

  log.info('Search plan prepared', searchPlan.entities);

  const [imageTiming, textTiming] = await Promise.all([
    measure('serperReverseImage', () => reverseImageSearch({ imageUrl, query: searchPlan.primaryQuery }), { logger: log }),
    measure('serperTextSearch', () => searchByQueries(searchPlan.textQueries), { logger: log })
  ]);

  if (imageTiming.error) {
    log.error('Reverse image search failed', { message: imageTiming.error.message });
  }
  if (textTiming.error) {
    log.error('Text search failed', { message: textTiming.error.message });
  }

  const imageHits = Array.isArray(imageTiming.result) ? imageTiming.result : [];
  let textHits = Array.isArray(textTiming.result) ? textTiming.result : [];

  const domainQueries = imageHits
    .map((hit) => hit.domain)
    .filter(Boolean)
    .slice(0, 3)
    .map((domain) => {
      if (entities.ids?.[0]) {
        return `site:${domain} "${entities.ids[0]}"`;
      }
      if (entities.names?.[0]) {
        return `site:${domain} "${entities.names[0]}" ${entities.documentType || 'document'}`;
      }
      return null;
    })
    .filter(Boolean);

  const additionalQueries = domainQueries.filter((query) => !searchPlan.textQueries.includes(query));
  let refinedTiming = null;

  if (additionalQueries.length) {
    refinedTiming = await measure('serperRefinedText', () => searchByQueries(additionalQueries), { logger: log });
    if (refinedTiming.error) {
      log.error('Refined text search failed', { message: refinedTiming.error.message });
    }
    const extraHits = Array.isArray(refinedTiming.result) ? refinedTiming.result : [];
    log.info('Executed additional domain queries', { count: additionalQueries.length });
    textHits = dedupeByUrl([...textHits, ...extraHits]);
  }

  textHits = dedupeByUrl(textHits);

  const report = await buildReport({
    imageUrl,
    ocr,
    vision,
    imageHits,
    textHits,
    searchPlan: {
      ...searchPlan,
      domains: imageHits.map((hit) => hit.domain),
      refinedQueries: dedupeList([...searchPlan.textQueries, ...domainQueries]),
      refinedEntities: entities
    },
    timings: compactTimings([
      fetchTiming,
      ocrTiming,
      visionTiming,
      imageTiming,
      textTiming,
      refinedTiming
    ])
  });

  log.success('Reverse search pipeline complete', { seconds: ((Date.now() - startedAt) / 1000).toFixed(2) });
  return report;
};

function dedupeByUrl(hits) {
  const seen = new Set();
  const unique = [];
  hits.forEach((hit) => {
    const key = hit.url || `${hit.query}-${hit.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(hit);
    }
  });
  return unique;
}

function dedupeList(list = []) {
  return Array.from(new Set(list.filter(Boolean)));
}

function compactTimings(records) {
  return records
    .filter(Boolean)
    .map(({ label, durationMs, error }) => ({
      label,
      durationMs,
      status: error ? 'failed' : 'ok'
    }));
}
