export interface RequestContext {
  method?: string;
  path?: string;
  body?: any;
  params?: any;
  query?: any;
}

export interface LlmConfig {
  provider: string; // 'openai' or 'google'
  apiKey: string;
  model?: string;
  apiUrl?: string;
}

export interface AutoHttpStatusConfig {
  llm?: LlmConfig;
}
