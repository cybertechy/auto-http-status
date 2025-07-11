import { LlmConfig } from './types';

let dotenvLoaded = false;

export function loadLlmConfigFromEnv(): LlmConfig | null {
  if (!dotenvLoaded) {
    try {
      require('dotenv').config();
      dotenvLoaded = true;
    } catch (error) {
      // dotenv not available, continue without it
    }
  }

  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const apiUrl = process.env.LLM_API_URL;

  if (!apiKey) {
    return null;
  }

  return {
    provider: 'openai',
    apiKey,
    model: model || 'gpt-4o-mini',
    apiUrl: apiUrl || 'https://api.openai.com/v1/chat/completions'
  };
}
