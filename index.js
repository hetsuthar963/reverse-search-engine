#!/usr/bin/env node
import { runReverseSearch } from './src/engine.js';
import { log } from './src/utils/logger.js';

const [, , imageUrl] = process.argv;

if (!imageUrl) {
  console.error('Usage: node index.js <image-url>');
  process.exit(1);
}

runReverseSearch(imageUrl)
  .then((report) => {
    log.success('Reverse search result ready');
    if (Array.isArray(report.timings) && report.timings.length) {
      report.timings.forEach(({ label, durationMs, status }) => {
        const statusIcon = status === 'ok' ? '⏱️' : '⚠️';
        console.log(`${statusIcon} ${label}: ${durationMs}ms (${status})`);
      });
    }
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    log.error('Reverse search failed', { message: error.message });
    process.exit(1);
  });
