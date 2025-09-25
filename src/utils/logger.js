import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.resolve(__dirname, '../../logs');
const ERROR_LOG = path.join(LOG_DIR, 'errors.log');
const REPORT_LOG = path.join(LOG_DIR, 'reports.log');

const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

const appendLine = (filePath, payload) => {
  ensureLogDir();
  const line = `${new Date().toISOString()} ${JSON.stringify(payload)}\n`;
  fs.appendFile(filePath, line, (err) => {
    if (err) {
      console.error('Failed to write log file', err);
    }
  });
};

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

const logWithLevel = (level, message, meta) => {
  if (meta) {
    pinoLogger[level](meta, message);
  } else {
    pinoLogger[level](message);
  }
};

export const log = {
  info: (message, meta) => logWithLevel('info', message, meta),
  warn: (message, meta) => logWithLevel('warn', message, meta),
  success: (message, meta) => logWithLevel('info', message, { status: 'success', ...(meta || {}) }),
  error: (message, meta) => {
    logWithLevel('error', message, meta);
    appendLine(ERROR_LOG, { level: 'error', message, meta });
  },
  report: (report) => {
    appendLine(REPORT_LOG, { report });
    pinoLogger.info({ reportSaved: true }, 'Report persisted to disk');
  }
};
