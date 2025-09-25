import { verifyContext } from './services/perplexity.js';
import { log } from './utils/logger.js';
import { stripMarkdownArtifacts } from './utils/text.js';

const summarizeResults = (imageHits, textHits) => {
  const newsHits = textHits.filter((hit) => /news|press|media/.test(hit.domain));
  const suspiciousTemplates = imageHits.filter((hit) => hit.tags.includes('template') || hit.tags.includes('fraud'));

  const keyFindings = [];
  if (imageHits.length) keyFindings.push(`${imageHits.length} visually similar images detected.`);
  if (newsHits.length) keyFindings.push(`${newsHits.length} news or press references found.`);
  if (suspiciousTemplates.length) keyFindings.push(`${suspiciousTemplates.length} matches point to template or fraud resources.`);
  if (!keyFindings.length) keyFindings.push('No strong matches identified.');

  return keyFindings;
};

export const buildReport = async ({ imageUrl, ocr, vision, imageHits, textHits, searchPlan, timings = [] }) => {
  const keyFindings = summarizeResults(imageHits, textHits);

  const cleanOCRText = stripMarkdownArtifacts(ocr.text || '');

  const reportDraft = {
    generatedAt: new Date().toISOString(),
    input: { imageUrl },
    ocr: {
      textPreview: cleanOCRText.slice(0, 400),
      error: ocr.error
    },
    vision: {
      description: vision.description,
      error: vision.error
    },
    matches: {
      imageHits,
      textHits
    },
    stats: {
      imageHitCount: imageHits.length,
      textHitCount: textHits.length
    },
    keyFindings,
    searchPlan,
    timings
  };

  const verification = await verifyContext({ report: reportDraft });

  const report = { ...reportDraft, verification };

  log.success('Report assembled', { imageHits: imageHits.length, textHits: textHits.length });
  log.report(report);
  return report;
};
