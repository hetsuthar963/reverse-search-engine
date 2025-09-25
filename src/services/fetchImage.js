import axios from 'axios';
import sharp from 'sharp';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

export const fetchImageAsBase64 = async (imageUrl) => {
  log.info('Downloading image', { imageUrl });
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: config.timeouts.fetchImage,
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'image/*,application/octet-stream'
    }
  });
  const buffer = Buffer.from(response.data);
  const mimeType = response.headers['content-type']?.split(';')[0] || 'image/jpeg';

  const base64 = await toOptimizedBase64(buffer, mimeType);
  log.success('Image downloaded', { bytes: buffer.length, mimeType });
  return { base64, mimeType };
};

const toOptimizedBase64 = async (buffer, mimeType) => {
  const shouldCompress = /image\/(jpeg|jpg|png|webp)/i.test(mimeType);
  if (!shouldCompress) {
    return buffer.toString('base64');
  }

  try {
    const pipeline = sharp(buffer).rotate();

    const resized = await pipeline
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
      .toFormat(/png$/i.test(mimeType) ? 'png' : 'jpeg', { quality: 80 })
      .toBuffer();

    log.info('Image compressed for vision API', {
      originalBytes: buffer.length,
      optimizedBytes: resized.length
    });

    return resized.toString('base64');
  } catch (error) {
    log.warn('Image compression failed, using original buffer', { message: error.message });
    return buffer.toString('base64');
  }
};
