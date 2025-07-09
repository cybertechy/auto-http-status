import { RequestContext, AutoHttpStatusConfig } from './types.js';
import { checkDirectStatus } from './layers/l1-direct.js';
import { checkErrorMappings } from './layers/l2-mappings.js';
import { checkKeywordMatches } from './layers/l3-keywords.js';
import { checkContextLogic } from './layers/l4-context.js';
import { checkLlmAnalysis } from './layers/l5-llm.js';
import { loadLlmConfigFromEnv } from './env-config.js';

export class AutoHttpStatus {
  private config: AutoHttpStatusConfig;

  constructor(config: AutoHttpStatusConfig = {}) {
    this.config = config;
    
    // If no LLM config provided, try to load from environment
    if (!this.config.llm) {
      const envLlmConfig = loadLlmConfigFromEnv();
      if (envLlmConfig) {
        this.config.llm = envLlmConfig;
      }
    }
  }

  public async getStatus(input: unknown, context: RequestContext = {}): Promise<number> {

    // L1: Check for direct status codes
    // This layer checks if the input is a direct status code or an object with a status property.
    // If found, it returns that status code immediately.
    const directStatus = checkDirectStatus(input);
    if (directStatus !== null) return directStatus;

    const error = input instanceof Error ? input : new Error(String(input));

    // L2: Check for error mappings
    // This layer checks if the error matches known error types or codes and returns the corresponding HTTP
    const mappingStatus = checkErrorMappings(error);
    if (mappingStatus !== null) return mappingStatus;

    // L3: Check for keyword matches
    // This layer checks if the error message contains specific keywords that map to HTTP status codes.
    const keywordStatus = checkKeywordMatches(error);
    if (keywordStatus !== null) return keywordStatus;

    // L4: Check context logic
    // This layer checks the request context (method, path, etc.) to determine a suitable HTTP status code.
    const contextStatus = checkContextLogic(input, context);
    if (contextStatus !== null) return contextStatus;

    if (this.config.llm?.provider === 'openai' && this.config.llm.apiKey) {
      try {
        return await checkLlmAnalysis(error, context, this.config.llm);
      } catch (llmError) {
        console.error('LLM analysis failed, falling back to default.', llmError);
      }
    }

    return 500;
  }

}

export const autoHttpStatus = new AutoHttpStatus();
