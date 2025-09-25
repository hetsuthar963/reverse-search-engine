import 'dotenv/config';

const required = {
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SERPER_API_KEY: process.env.SERPER_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export const config = {
  mistralKey: required.MISTRAL_API_KEY,
  geminiKey: required.GEMINI_API_KEY,
  serperKey: required.SERPER_API_KEY,
  perplexityKey: required.PERPLEXITY_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
  perplexityModel: process.env.PERPLEXITY_MODEL || 'sonar-pro',
  userAgent: 'DocShieldReverseSearch/1.0 (+https://docshield.example)',
  timeouts: {
    fetchImage: 20000,
    api: 30000,
    perplexity: 45000
  }
};
