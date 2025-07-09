import { checkContextLogic } from '../src/layers/l4-context';
import { RequestContext } from '../src/types';

describe('Layer 4 - Context Logic', () => {
  describe('Null/Undefined Handling for GET Requests', () => {
    it('should return 404 for null data with GET and params', () => {
      const context: RequestContext = {
        method: 'GET',
        params: { id: '123' }
      };
      expect(checkContextLogic(null, context)).toBe(404);
      expect(checkContextLogic(undefined, context)).toBe(404);
    });

    it('should return 200 for null data with GET but no params', () => {
      const context: RequestContext = {
        method: 'GET',
        params: {}
      };
      expect(checkContextLogic(null, context)).toBe(200);
    });

    it('should return 201 for null data with POST methods', () => {
      const context: RequestContext = {
        method: 'POST',
        params: { id: '123' }
      };
      expect(checkContextLogic(null, context)).toBe(201);
    });

    it('should handle case insensitive GET method', () => {
      const context: RequestContext = {
        method: 'get',
        params: { id: '123' }
      };
      expect(checkContextLogic(null, context)).toBe(404);
    });
  });

  describe('Success Response Handling', () => {
    it('should return 201 for POST requests with data', () => {
      const context: RequestContext = { method: 'POST' };
      const data = { id: 1, name: 'Test' };
      expect(checkContextLogic(data, context)).toBe(201);
    });

    it('should return 204 for DELETE requests with data', () => {
      const context: RequestContext = { method: 'DELETE' };
      const data = { success: true };
      expect(checkContextLogic(data, context)).toBe(204);
    });

    it('should return 200 for GET requests with data', () => {
      const context: RequestContext = { method: 'GET' };
      const data = { id: 1, name: 'Test' };
      expect(checkContextLogic(data, context)).toBe(200);
    });

    it('should return 200 for PUT requests with data', () => {
      const context: RequestContext = { method: 'PUT' };
      const data = { id: 1, name: 'Updated' };
      expect(checkContextLogic(data, context)).toBe(200);
    });

    it('should return 200 for PATCH requests with data', () => {
      const context: RequestContext = { method: 'PATCH' };
      const data = { name: 'Patched' };
      expect(checkContextLogic(data, context)).toBe(200);
    });

    it('should handle case insensitive HTTP methods', () => {
      expect(checkContextLogic({}, { method: 'post' })).toBe(201);
      expect(checkContextLogic({}, { method: 'delete' })).toBe(204);
      expect(checkContextLogic({}, { method: 'put' })).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return null for Error instances', () => {
      const error = new Error('Test error');
      const context: RequestContext = { method: 'GET' };
      expect(checkContextLogic(error, context)).toBeNull();
    });

    it('should return null for Error instances even with params', () => {
      const error = new Error('Test error');
      const context: RequestContext = {
        method: 'GET',
        params: { id: '123' }
      };
      expect(checkContextLogic(error, context)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context', () => {
      const data = { test: true };
      expect(checkContextLogic(data, {})).toBe(200);
    });

    it('should handle undefined method', () => {
      const data = { test: true };
      const context: RequestContext = { method: undefined };
      expect(checkContextLogic(data, context)).toBe(200);
    });

    it('should handle unknown HTTP methods', () => {
      const data = { test: true };
      const context: RequestContext = { method: 'CUSTOM' };
      expect(checkContextLogic(data, context)).toBe(200);
    });

    it('should handle falsy but not null/undefined values', () => {
      const context: RequestContext = { method: 'GET' };
      expect(checkContextLogic(0, context)).toBe(200);
      expect(checkContextLogic('', context)).toBe(200);
      expect(checkContextLogic(false, context)).toBe(200);
    });
  });

  describe('Complex Context Scenarios', () => {
    it('should work with full request context', () => {
      const context: RequestContext = {
        method: 'GET',
        path: '/api/users/123',
        params: { id: '123' },
        query: { include: 'posts' },
        body: null
      };
      expect(checkContextLogic(null, context)).toBe(404);
    });

    it('should prioritize data presence over context', () => {
      const context: RequestContext = {
        method: 'GET',
        params: { id: '123' }
      };
      const data = { user: 'found' };
      expect(checkContextLogic(data, context)).toBe(200);
    });
  });
});
