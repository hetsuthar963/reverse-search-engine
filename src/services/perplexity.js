import axios from 'axios';
import { config } from '../config.js';
import { log } from '../utils/logger.js';
import { generateHybridVerificationPrompt } from '../utils/prompt.js';

const ENDPOINT = 'https://api.perplexity.ai/chat/completions';

export const verifyContext = async ({ report }) => {
  // const prompt = generateHybridVerificationPrompt({
  //   imageUrl: report?.input?.imageUrl,
  //   ocrText: report?.ocr?.textPreview,
  //   visionDescription: report?.vision?.description,
  //   serperImageHits: report?.matches?.imageHits || [],
  //   serperTextHits: report?.matches?.textHits || [],
  //   entities: report?.searchPlan?.entities || {}
  // });
  const prompt = generateHybridVerificationPrompt(report);  // ✅ Pass entire report object


  const messages = [
    {
      role: 'system',
      content: 'You are a document fraud investigator with live web access. Return JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const { data } = await axios.post(
      ENDPOINT,
      { model: config.perplexityModel, messages, temperature: 0.2 },
      {
        timeout: config.timeouts.perplexity || config.timeouts.api,
        headers: {
          Authorization: `Bearer ${config.perplexityKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = data?.choices?.[0]?.message?.content?.trim();
    log.success('Perplexity verification complete');

    try {
      const sanitized = reply?.replace(/```json|```/g, '').trim();
      return JSON.parse(sanitized);
    } catch (parseError) {
      return { authenticity: 'uncertain', confidence: 30, rationale: reply || 'Model returned unstructured response.' };
    }
  } catch (error) {
    log.error('Perplexity verification failed', { message: error.response?.data || error.message });
    return {
      authenticity: 'highly-suspicious',
      confidence: 55,
      rationale: 'Verification failed due to API error. No reverse image matches found. ID not verifiable online.',
      keySignals: [
        'No reverse image matches',
        'ID not verified',
        'Vision analysis may be incomplete'
      ],
      recommendations: [
        'Verify number on https://uidai.gov.in',
        'Scan QR code with official app',
        'Require live photo verification'
      ]
    };
  }
};
