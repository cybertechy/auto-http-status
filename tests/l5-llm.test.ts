import { checkLlmAnalysis } from '../src/layers/l5-llm';
import { LlmConfig, RequestContext } from '../src/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Layer 5 - LLM Analysis', () => {
  const mockConfig: LlmConfig = {
    provider: 'openai',
    apiKey: 'test-api-key',
    model: 'gpt-4o-mini',
    apiUrl: 'https://api.openai.com/v1/chat/completions'
  };

  const mockContext: RequestContext = {
    method: 'GET',
    path: '/api/users/123'
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Successful LLM Responses', () => {
    it('should return status code from successful LLM response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '404'
            }
          }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('User not found');
      const result = await checkLlmAnalysis(error, mockContext, mockConfig);
      
      expect(result).toBe(404);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }
        })
      );
    });

    it('should handle different valid status codes', async () => {
      const testCases = [200, 201, 400, 401, 403, 404, 409, 422, 429, 500, 503, 504];
      
      for (const statusCode of testCases) {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: statusCode.toString()
              }
            }]
          })
        };
        mockFetch.mockResolvedValue(mockResponse as any);

        const error = new Error('Test error');
        const result = await checkLlmAnalysis(error, mockContext, mockConfig);
        
        expect(result).toBe(statusCode);
      }
    });

    it('should use custom API URL when provided', async () => {
      const customConfig = {
        ...mockConfig,
        apiUrl: 'https://custom-llm.example.com/v1/chat'
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '200' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      await checkLlmAnalysis(error, mockContext, customConfig);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-llm.example.com/v1/chat',
        expect.any(Object)
      );
    });

    it('should use default URL when apiUrl is not provided', async () => {
      const configWithoutUrl = {
        provider: 'openai' as const,
        apiKey: 'test-key',
        model: 'gpt-4o-mini'
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '200' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      await checkLlmAnalysis(error, mockContext, configWithoutUrl);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      );
    });
  });

  describe('Request Body Validation', () => {
    it('should send correct request body structure', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '400' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Validation failed');
      await checkLlmAnalysis(error, mockContext, mockConfig);
      
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      
      expect(requestBody).toEqual({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: expect.stringContaining('Error Name: Error')
        }],
        max_tokens: 5,
        temperature: 0.0
      });
    });

    it('should include error details in prompt', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '404' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new TypeError('Invalid user ID');
      const context = {
        method: 'POST',
        path: '/api/users'
      };
      
      await checkLlmAnalysis(error, context, mockConfig);
      
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      const prompt = requestBody.messages[0].content;
      
      expect(prompt).toContain('Error Name: TypeError');
      expect(prompt).toContain('Error Message: Invalid user ID');
      expect(prompt).toContain('Request Method: POST');
      expect(prompt).toContain('Request Path: /api/users');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for failed API requests', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('OpenAI API request failed with status 401');
    });

    it('should throw error for invalid status codes from LLM', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '999' // Invalid status code
            }
          }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('Failed to parse a valid status code from LLM response.');
    });

    it('should throw error for non-numeric responses', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'not a number'
            }
          }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('Failed to parse a valid status code from LLM response.');
    });

    it('should throw error for empty response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: ''
            }
          }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('Failed to parse a valid status code from LLM response.');
    });

    it('should throw error for malformed response structure', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: []
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('Failed to parse a valid status code from LLM response.');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const error = new Error('Test error');
      
      await expect(checkLlmAnalysis(error, mockContext, mockConfig))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace in LLM response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '  404  '
            }
          }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      const result = await checkLlmAnalysis(error, mockContext, mockConfig);
      
      expect(result).toBe(404);
    });

    it('should handle missing context values', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '500' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const error = new Error('Test error');
      const emptyContext = {};
      
      const result = await checkLlmAnalysis(error, emptyContext, mockConfig);
      expect(result).toBe(500);
      
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      const prompt = requestBody.messages[0].content;
      
      expect(prompt).toContain('Request Method: N/A');
      expect(prompt).toContain('Request Path: N/A');
    });
  });
});
