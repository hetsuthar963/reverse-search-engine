import axios from 'axios';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

const OCR_ENDPOINT = 'https://api.mistral.ai/v1/ocr';

export const extractText = async (base64Image, mimeType = 'image/jpeg') => {
  try {
    const { data } = await axios.post(
      OCR_ENDPOINT,
      {
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          image_url: `data:${mimeType};base64,${base64Image}`
        },
        include_image_base64: false
      },
      {
        timeout: config.timeouts.api,
        headers: {
          Authorization: `Bearer ${config.mistralKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const pages = Array.isArray(data?.pages) ? data.pages : [];
    let text = data?.text?.trim() || '';

    if (!text && pages.length) {
      text = pages
        .map((page) => (page.markdown || page.text || '').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    log.success('OCR extraction finished', { chars: text.length });
    return {
      text,
      raw: data,
      error: null
    };
  } catch (error) {
    log.error('Mistral OCR failed', { message: error.response?.data || error.message });
    return { text: '', raw: null, error: error.message };
  }
};
