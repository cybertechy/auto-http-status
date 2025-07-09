import { loadLlmConfigFromEnv } from '../src/env-config';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear any env variables that might affect tests
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadLlmConfigFromEnv', () => {
    it('should return null when no API key is provided', () => {
      const config = loadLlmConfigFromEnv();
      expect(config).toBeNull();
    });

    it('should return config when API key is provided', () => {
      process.env.LLM_API_KEY = 'test-api-key';
      
      const config = loadLlmConfigFromEnv();
      
      expect(config).toEqual({
        provider: 'openai',
        apiKey: 'test-api-key',
        model: 'gpt-4o-mini',
        apiUrl: 'https://api.openai.com/v1/chat/completions'
      });
    });

    it('should use custom model when provided', () => {
      process.env.LLM_API_KEY = 'test-api-key';
      process.env.LLM_MODEL = 'gpt-4-turbo';
      
      const config = loadLlmConfigFromEnv();
      
      expect(config?.model).toBe('gpt-4-turbo');
    });

    it('should use custom API URL when provided', () => {
      process.env.LLM_API_KEY = 'test-api-key';
      process.env.LLM_API_URL = 'https://custom-api.example.com/v1/chat';
      
      const config = loadLlmConfigFromEnv();
      
      expect(config?.apiUrl).toBe('https://custom-api.example.com/v1/chat');
    });

    it('should use all custom values when provided', () => {
      process.env.LLM_API_KEY = 'custom-key';
      process.env.LLM_MODEL = 'custom-model';
      process.env.LLM_API_URL = 'https://custom.example.com/chat';
      
      const config = loadLlmConfigFromEnv();
      
      expect(config).toEqual({
        provider: 'openai',
        apiKey: 'custom-key',
        model: 'custom-model',
        apiUrl: 'https://custom.example.com/chat'
      });
    });

    it('should handle missing dotenv gracefully', () => {
      // Mock require to throw error for dotenv
      const originalRequire = globalThis.require;
      (globalThis as any).require = jest.fn().mockImplementation((module: string) => {
        if (module === 'dotenv') {
          throw new Error('Module not found');
        }
        return originalRequire(module);
      });

      process.env.LLM_API_KEY = 'test-key';
      
      // Should still work without dotenv
      const config = loadLlmConfigFromEnv();
      expect(config?.apiKey).toBe('test-key');
      
      (globalThis as any).require = originalRequire;
    });

    it('should load dotenv only once', () => {
      // Reset the module state first
      jest.resetModules();
      
      const dotenv = require('dotenv');
      process.env.LLM_API_KEY = 'test-key';
      
      // Import fresh module instance
      const { loadLlmConfigFromEnv } = require('../src/env-config');
      
      loadLlmConfigFromEnv();
      loadLlmConfigFromEnv();
      
      expect(dotenv.config).toHaveBeenCalledTimes(1);
    });
  });
});
