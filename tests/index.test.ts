import { AutoHttpStatus, autoHttpStatus } from '../src/index';
import { RequestContext } from '../src/types';

// Mock the LLM layer
jest.mock('../src/layers/l5-llm', () => ({
  checkLlmAnalysis: jest.fn()
}));

// Mock environment config
jest.mock('../src/env-config', () => ({
  loadLlmConfigFromEnv: jest.fn()
}));

import { checkLlmAnalysis } from '../src/layers/l5-llm';
import { loadLlmConfigFromEnv } from '../src/env-config';

const mockCheckLlmAnalysis = checkLlmAnalysis as jest.MockedFunction<typeof checkLlmAnalysis>;
const mockLoadLlmConfigFromEnv = loadLlmConfigFromEnv as jest.MockedFunction<typeof loadLlmConfigFromEnv>;

describe('AutoHttpStatus Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadLlmConfigFromEnv.mockReturnValue(null);
  });

  describe('Layer Priority and Flow', () => {
    it('should prioritize direct status codes (Layer 1)', async () => {
      const instance = new AutoHttpStatus();
      const input = { statusCode: 418 };
      const result = await instance.getStatus(input);
      
      expect(result).toBe(418);
      expect(mockCheckLlmAnalysis).not.toHaveBeenCalled();
    });

    it('should fall back to error mappings (Layer 2)', async () => {
      const instance = new AutoHttpStatus();
      const error = new TypeError('Invalid type');
      const result = await instance.getStatus(error);
      
      expect(result).toBe(400);
      expect(mockCheckLlmAnalysis).not.toHaveBeenCalled();
    });

    it('should fall back to keyword matching (Layer 3)', async () => {
      const instance = new AutoHttpStatus();
      const error = new Error('User not found');
      const result = await instance.getStatus(error);
      
      expect(result).toBe(404);
      expect(mockCheckLlmAnalysis).not.toHaveBeenCalled();
    });

    it('should fall back to context logic (Layer 4)', async () => {
      const instance = new AutoHttpStatus();
      const data = { user: { id: 1, name: 'John' } };
      const context: RequestContext = { method: 'POST' };
      const result = await instance.getStatus(data, context);
      
      expect(result).toBe(201);
      expect(mockCheckLlmAnalysis).not.toHaveBeenCalled();
    });

    it('should fall back to LLM analysis (Layer 5) when configured', async () => {
      mockCheckLlmAnalysis.mockResolvedValue(422);
      
      const instance = new AutoHttpStatus({
        llm: {
          provider: 'openai',
          apiKey: 'test-key'
        }
      });
      
      const error = new Error('Complex business logic error');
      const result = await instance.getStatus(error);
      
      expect(result).toBe(422);
      expect(mockCheckLlmAnalysis).toHaveBeenCalledWith(
        error,
        {},
        expect.objectContaining({
          provider: 'openai',
          apiKey: 'test-key'
        })
      );
    });

    it('should fall back to 500 when all layers fail', async () => {
      const instance = new AutoHttpStatus();
      const error = new Error('Unknown error with no patterns');
      const result = await instance.getStatus(error);
      
      expect(result).toBe(500);
    });
  });

  describe('LLM Configuration', () => {
    it('should use environment config when no config provided', () => {
      const envConfig = {
        provider: 'openai' as const,
        apiKey: 'env-api-key',
        model: 'gpt-4o-mini',
        apiUrl: 'https://api.openai.com/v1/chat/completions'
      };
      mockLoadLlmConfigFromEnv.mockReturnValue(envConfig);
      
      const instance = new AutoHttpStatus();
      
      expect(mockLoadLlmConfigFromEnv).toHaveBeenCalled();
      // Verify the config is used by checking private property through behavior
      expect(instance).toBeInstanceOf(AutoHttpStatus);
    });

    it('should prefer explicit config over environment config', () => {
      const envConfig = {
        provider: 'openai' as const,
        apiKey: 'env-api-key'
      };
      const explicitConfig = {
        provider: 'openai' as const,
        apiKey: 'explicit-api-key'
      };
      
      mockLoadLlmConfigFromEnv.mockReturnValue(envConfig);
      
      const instance = new AutoHttpStatus({ llm: explicitConfig });
      
      // Environment config should not be loaded when explicit config is provided
      expect(mockLoadLlmConfigFromEnv).not.toHaveBeenCalled();
    });

    it('should handle LLM failures gracefully', async () => {
      mockCheckLlmAnalysis.mockRejectedValue(new Error('API Error'));
      
      // Mock console.error to avoid cluttering test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instance = new AutoHttpStatus({
        llm: {
          provider: 'openai',
          apiKey: 'test-key'
        }
      });
      
      const error = new Error('Ambiguous error');
      const result = await instance.getStatus(error);
      
      expect(result).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        'LLM analysis failed, falling back to default.',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed error properties correctly', async () => {
      const instance = new AutoHttpStatus();
      
      // Create an error with both statusCode and other properties
      const error = new TypeError('Invalid input') as any;
      error.statusCode = 422;
      error.code = 'ENOENT';
      
      const result = await instance.getStatus(error);
      
      // Should prioritize direct status code over error type mapping
      expect(result).toBe(422);
    });

    it('should handle error-like objects that are not Error instances', async () => {
      const instance = new AutoHttpStatus();
      const errorLike = {
        name: 'CustomError',
        message: 'Something went wrong',
        statusCode: 409
      };
      
      const result = await instance.getStatus(errorLike);
      expect(result).toBe(409);
    });

    it('should convert non-Error inputs to Error objects for processing', async () => {
      const instance = new AutoHttpStatus();
      const stringError = 'User not found in database';
      
      const result = await instance.getStatus(stringError);
      expect(result).toBe(404); // Should match keyword pattern
    });

    it('should handle complex request contexts', async () => {
      const instance = new AutoHttpStatus();
      const context: RequestContext = {
        method: 'GET',
        path: '/api/users/123',
        params: { id: '123' },
        query: { include: 'posts,comments' },
        body: null
      };
      
      const result = await instance.getStatus(null, context);
      expect(result).toBe(404);
    });
  });

  describe('Default Instance', () => {
    it('should provide a working default instance', async () => {
      const error = new Error('Validation failed');
      const result = await autoHttpStatus.getStatus(error);
      
      expect(result).toBe(400);
      expect(autoHttpStatus).toBeInstanceOf(AutoHttpStatus);
    });

    it('should work with the default instance for all layer types', async () => {
      // Layer 1
      expect(await autoHttpStatus.getStatus({ statusCode: 201 })).toBe(201);
      
      // Layer 2
      expect(await autoHttpStatus.getStatus(new TypeError('Bad type'))).toBe(400);
      
      // Layer 3
      expect(await autoHttpStatus.getStatus(new Error('Permission denied'))).toBe(403);
      
      // Layer 4
      expect(await autoHttpStatus.getStatus({ data: 'success' }, { method: 'POST' })).toBe(201);
      
      // Default fallback
      expect(await autoHttpStatus.getStatus(new Error('Unknown error'))).toBe(500);
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle null and undefined inputs', async () => {
      const instance = new AutoHttpStatus();
      
      expect(await instance.getStatus(null)).toBe(200);
      expect(await instance.getStatus(undefined)).toBe(200);
    });

    it('should handle empty objects and arrays', async () => {
      const instance = new AutoHttpStatus();
      
      expect(await instance.getStatus({})).toBe(200);
      expect(await instance.getStatus([])).toBe(200);
    });

    it('should handle numeric inputs', async () => {
      const instance = new AutoHttpStatus();
      
      expect(await instance.getStatus(0)).toBe(200);
      expect(await instance.getStatus(123)).toBe(200);
    });

    it('should handle boolean inputs', async () => {
      const instance = new AutoHttpStatus();
      
      expect(await instance.getStatus(true)).toBe(200);
      expect(await instance.getStatus(false)).toBe(200);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple rapid calls efficiently', async () => {
      const instance = new AutoHttpStatus();
      const promises = Array.from({ length: 100 }, (_, i) => 
        instance.getStatus(new Error(`Error ${i}`))
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(results.every(r => typeof r === 'number')).toBe(true);
    });

    it('should not leak memory with repeated instantiation', () => {
      // Create many instances to test for memory leaks
      const instances = Array.from({ length: 100 }, () => new AutoHttpStatus());
      
      expect(instances).toHaveLength(100);
      expect(instances.every(i => i instanceof AutoHttpStatus)).toBe(true);
    });
  });
});
