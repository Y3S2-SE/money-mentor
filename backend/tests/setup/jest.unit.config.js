import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../jest.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  ...base,
  rootDir: path.resolve(__dirname, '../..'),
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    // exclude from unit:
    '!models/insightCache.model.js',
    '!models/badge.model.js',
    '!middleware/rateLimiter.js',
    '!middleware/upload.middleware.js',
  ],
};