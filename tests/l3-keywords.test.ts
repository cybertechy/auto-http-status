import { checkKeywordMatches } from '../src/layers/l3-keywords';

describe('Layer 3 - Keyword Matching', () => {
  describe('Authentication Errors (401)', () => {
    it('should detect authentication required', () => {
      expect(checkKeywordMatches(new Error('Authentication required'))).toBe(401);
      expect(checkKeywordMatches(new Error('AUTHENTICATION REQUIRED'))).toBe(401);
    });

    it('should detect missing token errors', () => {
      expect(checkKeywordMatches(new Error('Missing or invalid token'))).toBe(401);
      expect(checkKeywordMatches(new Error('JWT token expired'))).toBe(401);
    });
  });

  describe('Permission Errors (403)', () => {
    it('should detect permission denied', () => {
      expect(checkKeywordMatches(new Error('Permission denied'))).toBe(403);
      expect(checkKeywordMatches(new Error('Access denied'))).toBe(403);
    });
  });

  describe('Not Found Errors (404)', () => {
    it('should detect not found messages', () => {
      expect(checkKeywordMatches(new Error('User not found'))).toBe(404);
      expect(checkKeywordMatches(new Error('Resource does not exist'))).toBe(404);
    });
  });

  describe('Conflict Errors (409)', () => {
    it('should detect duplicate key errors', () => {
      expect(checkKeywordMatches(new Error('Duplicate key violation'))).toBe(409);
      expect(checkKeywordMatches(new Error('Resource already exists'))).toBe(409);
    });
  });

  describe('Bad Request Errors (400)', () => {
    it('should detect validation errors', () => {
      expect(checkKeywordMatches(new Error('Invalid input provided'))).toBe(400);
      expect(checkKeywordMatches(new Error('Validation failed for field'))).toBe(400);
      expect(checkKeywordMatches(new Error('Value must be a string'))).toBe(400);
      expect(checkKeywordMatches(new Error('Should be type number'))).toBe(400);
    });

    it('should detect bad request messages', () => {
      expect(checkKeywordMatches(new Error('Bad request format'))).toBe(400);
    });
  });

  describe('Unprocessable Entity (422)', () => {
    it('should detect unprocessable entity errors', () => {
      expect(checkKeywordMatches(new Error('Unprocessable entity'))).toBe(422);
      expect(checkKeywordMatches(new Error('Could not process request'))).toBe(422);
    });
  });

  describe('Rate Limiting (429)', () => {
    it('should detect rate limit errors', () => {
      expect(checkKeywordMatches(new Error('Rate limit exceeded'))).toBe(429);
      expect(checkKeywordMatches(new Error('Too many requests'))).toBe(429);
    });
  });

  describe('Timeout Errors (504)', () => {
    it('should detect timeout errors', () => {
      expect(checkKeywordMatches(new Error('Request timeout'))).toBe(504);
      expect(checkKeywordMatches(new Error('Operation timed out'))).toBe(504);
    });
  });

  describe('Service Unavailable (503)', () => {
    it('should detect service unavailable errors', () => {
      expect(checkKeywordMatches(new Error('Service unavailable'))).toBe(503);
      expect(checkKeywordMatches(new Error('Service is down'))).toBe(503);
    });
  });

  describe('Case Insensitivity', () => {
    it('should work with different cases', () => {
      expect(checkKeywordMatches(new Error('NOT FOUND'))).toBe(404);
      expect(checkKeywordMatches(new Error('not found'))).toBe(404);
      expect(checkKeywordMatches(new Error('Not Found'))).toBe(404);
    });
  });

  describe('Priority Testing', () => {
    it('should return first match (authentication over permission)', () => {
      expect(checkKeywordMatches(new Error('Authentication required, permission denied'))).toBe(401);
    });

    it('should prioritize specific over general matches', () => {
      expect(checkKeywordMatches(new Error('Authentication required for this bad request'))).toBe(401);
    });
  });

  describe('No Match Cases', () => {
    it('should return null for unmatched messages', () => {
      expect(checkKeywordMatches(new Error('Something went wrong'))).toBeNull();
      expect(checkKeywordMatches(new Error('Unknown error occurred'))).toBeNull();
      expect(checkKeywordMatches(new Error(''))).toBeNull();
    });
  });
});
