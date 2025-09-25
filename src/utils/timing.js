export const measure = async (label, fn, { logger } = {}) => {
  const start = Date.now();
  if (logger) {
    logger.info(`⏳ ${label} started`);
  }
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (logger) {
      logger.success(`${label} completed`, { durationMs });
    }
    return { label, result, durationMs, error: null };
  } catch (error) {
    const durationMs = Date.now() - start;
    if (logger) {
      logger.error(`${label} failed`, { durationMs, message: error.message });
    }
    return { label, result: null, durationMs, error };
  }
};
