import { RequestContext, LlmConfig } from '../types';

const MAX_OUTPUT_TOKENS = 5;
const TEMPERATURE = 0.0;
const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_DEFAULT_MODEL = 'gpt-4.1-nano-2025-04-14';

interface LlmProvider {
  makeRequest(prompt: string, llmConfig: LlmConfig): Promise<string>;
}

class GeminiProvider implements LlmProvider {
  async makeRequest(prompt: string, llmConfig: LlmConfig): Promise<string> {
    this.validateConfig(llmConfig);
    
    const url = this.buildUrl(llmConfig);
    const body = this.buildRequestBody(prompt);
    
    const response = await this.sendRequest(url, body);
    return this.extractResponse(response);
  }

  private validateConfig(llmConfig: LlmConfig): void {
    if (!llmConfig.apiUrl) {
      throw new Error('Gemini API URL is missing in llmConfig');
    }
    if (!llmConfig.apiKey) {
      throw new Error('Gemini API key is missing in llmConfig');
    }
  }

  private buildUrl(llmConfig: LlmConfig): string {
    const urlObj = new URL(llmConfig.apiUrl!);
    urlObj.searchParams.append('key', llmConfig.apiKey!);
    return urlObj.toString();
  }

  private buildRequestBody(prompt: string): object {
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    };
  }

  private async sendRequest(url: string, body: object): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      throw new Error(`Gemini API request failed with status ${response.status}. Response body: ${errorBody}`);
    }

    return response.json();
  }

  private extractResponse(result: any): string {
    const statusCodeText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!statusCodeText) {
      throw new Error('Failed to extract response from Gemini API');
    }
    return statusCodeText;
  }
}

class OpenAIProvider implements LlmProvider {
  async makeRequest(prompt: string, llmConfig: LlmConfig): Promise<string> {
    this.validateConfig(llmConfig);
    
    const url = llmConfig.apiUrl || OPENAI_DEFAULT_URL;
    const body = this.buildRequestBody(prompt, llmConfig);
    
    const response = await this.sendRequest(url, body, llmConfig);
    return this.extractResponse(response);
  }

  private validateConfig(llmConfig: LlmConfig): void {
    if (!llmConfig.apiKey) {
      throw new Error('OpenAI API key is missing in llmConfig');
    }
  }

  private buildRequestBody(prompt: string, llmConfig: LlmConfig): object {
    return {
      model: llmConfig.model || OPENAI_DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    };
  }

  private async sendRequest(url: string, body: object, llmConfig: LlmConfig): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      throw new Error(`OpenAI API request failed with status ${response.status}. Response body: ${errorBody}`);
    }

    return response.json();
  }

  private extractResponse(result: any): string {
    const statusCodeText = result.choices?.[0]?.message?.content?.trim();
    if (!statusCodeText) {
      throw new Error('Failed to extract response from OpenAI API');
    }
    return statusCodeText;
  }
}

function createProvider(llmConfig: LlmConfig): LlmProvider {
  switch (llmConfig.provider) {
    case 'google':
      return new GeminiProvider();
    case 'openai':
    default:
      return new OpenAIProvider();
  }
}

function buildPrompt(error: Error, context: RequestContext): string {
  return `
    Based on the following Node.js error and HTTP request context, provide the single most appropriate 3-digit HTTP status code.
    Return ONLY the number and nothing else.

    Error Name: ${error.name}
    Error Message: ${error.message}
    Request Method: ${context.method || 'N/A'}
    Request Path: ${context.path || 'N/A'}

    Example Response: 404
  `;
}

function parseStatusCode(statusCodeText: string): number {
  const statusCode = parseInt(statusCodeText, 10);
  if (isNaN(statusCode) || statusCode < 100 || statusCode >= 600) {
    throw new Error(`Invalid status code received: ${statusCodeText}`);
  }
  return statusCode;
}

export async function checkLlmAnalysis(error: Error, context: RequestContext, llmConfig: LlmConfig): Promise<number> {
  try {
    const provider = createProvider(llmConfig);
    const prompt = buildPrompt(error, context);
    const statusCodeText = await provider.makeRequest(prompt, llmConfig);
    return parseStatusCode(statusCodeText);
  } catch (err) {
    throw new Error(`LLM analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
