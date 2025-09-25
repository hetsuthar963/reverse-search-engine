import axios from 'axios';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

const baseHeaders = {
  'X-API-KEY': config.serperKey,
  'Content-Type': 'application/json'
};

export const reverseImageSearch = async ({ imageUrl, query }) => {
  const q = query || imageUrl;
  if (!q) {
    return [];
  }
  try {
    const { data } = await axios.post(
      'https://google.serper.dev/images',
      {
        q,
        imageUrl,
        num: 10,
        gl: 'in',
        hl: 'en'
      },
      { headers: baseHeaders, timeout: config.timeouts.api }
    );

    const images = (data?.images || []).map((item, index) => ({
      title: item.title || 'untitled',
      url: item.imageUrl || item.link,
      sourceUrl: item.link,
      domain: safeHostname(item.link),
      position: index + 1,
      snippet: item.snippet || '',
      tags: collectTags(item.title, item.snippet)
    }));

    log.success('Serper reverse image search complete', { count: images.length, query: q });
    return images;
  } catch (error) {
    log.error('Serper reverse image search failed', { message: error.response?.data || error.message, query: q });
    return [];
  }
};

export const searchByQueries = async (queries) => {
  const limited = queries.filter(Boolean).slice(0, 5);
  if (!limited.length) {
    return [];
  }

  const results = await Promise.allSettled(
    limited.map(async (query) => {
      const { data } = await axios.post(
        'https://google.serper.dev/search',
        { q: query, num: 8, hl: 'en', gl: 'us' },
        { headers: baseHeaders, timeout: config.timeouts.api }
      );

      const organic = data?.organic || [];
      return organic.map((entry, index) => ({
        query,
        title: entry.title,
        url: entry.link,
        snippet: entry.snippet || '',
        domain: safeHostname(entry.link),
        position: index + 1
      }));
    })
  );

  const flattened = [];
  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      flattened.push(...res.value);
    } else {
      log.error('Serper text search failed', { query: limited[idx], message: res.reason.message });
    }
  });

  log.success('Serper text queries complete', { totalHits: flattened.length, queries: limited.length });
  return flattened;
};

const safeHostname = (url) => {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (err) {
    return 'unknown';
  }
};

const collectTags = (...texts) => {
  const corpus = texts.join(' ').toLowerCase();
  const tags = [];
  ['template', 'fraud', 'scam', 'news', 'report', 'investigation', 'press', 'social'].forEach((term) => {
    if (corpus.includes(term)) tags.push(term);
  });
  return tags;
};
