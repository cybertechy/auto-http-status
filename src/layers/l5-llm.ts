import { RequestContext, LlmConfig } from '../types';

export async function checkLlmAnalysis(error: Error, context: RequestContext, llmConfig: LlmConfig): Promise<number> {
  const prompt = `
    Based on the following Node.js error and HTTP request context, provide the single most appropriate 3-digit HTTP status code.
    Return ONLY the number and nothing else.

    Error Name: ${error.name}
    Error Message: ${error.message}
    Request Method: ${context.method || 'N/A'}
    Request Path: ${context.path || 'N/A'}

    Example Response: 404
  `;

  if (llmConfig.provider === 'google') {
    // Gemini API expects API key as query param, and a different body format
    if (!llmConfig.apiUrl) {
      throw new Error('Gemini API URL is missing in llmConfig.');
    }
    if (!llmConfig.apiKey) {
      throw new Error('Gemini API key is missing in llmConfig.');
    }
    const urlObj = new URL(llmConfig.apiUrl);
    urlObj.searchParams.append('key', llmConfig.apiKey);
    const url = urlObj.toString();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 5,
          temperature: 0.0,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }
    const result = await response.json() as any;
    // Gemini response: candidates[0].content.parts[0].text
    const statusCodeText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (statusCodeText) {
      const statusCode = parseInt(statusCodeText, 10);
      if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
        return statusCode;
      }
    }
    throw new Error('Failed to parse a valid status code from Gemini response.');
  } else {
    // Default: OpenAI API
    const response = await fetch(llmConfig.apiUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model || 'gpt-4.1-nano-2025-04-14',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5,
        temperature: 0.0,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status ${response.status}`);
    }
    const result = await response.json() as {
      choices: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const statusCodeText = result.choices[0]?.message?.content?.trim();
    if (statusCodeText) {
      const statusCode = parseInt(statusCodeText, 10);
      if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
        return statusCode;
      }
    }
    throw new Error('Failed to parse a valid status code from LLM response.');
  }
}
