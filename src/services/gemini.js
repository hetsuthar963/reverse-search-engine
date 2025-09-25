import axios from 'axios';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

export const describeImage = async (base64Image, mimeType = 'image/jpeg') => {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'Describe this image in detail and list any contextual cues (names, text, logos, locations, dates).'
          },
          {
            inlineData: { mimeType, data: base64Image }
          }
        ]
      }
    ]
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiKey}`;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const { data } = await axios.post(endpoint, payload, {
        timeout: config.timeouts.api,
        headers: { 'Content-Type': 'application/json' }
      });

      const description = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      log.success('Gemini vision description ready', { lines: description.split('\n').length });
      return { description, raw: data, error: null };
    } catch (error) {
      const message = error.response?.data || error.message;
      if (attempt < 2 && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))) {
        log.warn('Gemini vision timed out, retrying with fallback timeout', { attempt });
        await new Promise((resolve) => setTimeout(resolve, 750));
        continue;
      }
      log.error('Gemini vision failed', { message });
      return { description: '', raw: null, error: message };
    }
  }

  return { description: '', raw: null, error: 'Gemini vision unavailable' };
};
