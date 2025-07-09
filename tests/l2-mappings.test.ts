import { checkErrorMappings } from '../src/layers/l2-mappings';

describe('Layer 2 - Error Mappings', () => {
  describe('Error Type Mappings', () => {
    it('should map TypeError to 400', () => {
      const error = new TypeError('Invalid type');
      expect(checkErrorMappings(error)).toBe(400);
    });

    it('should map ReferenceError to 500', () => {
      const error = new ReferenceError('Variable not defined');
      expect(checkErrorMappings(error)).toBe(500);
    });

    it('should map SyntaxError to 400', () => {
      const error = new SyntaxError('Invalid syntax');
      expect(checkErrorMappings(error)).toBe(400);
    });

    it('should map ValidationError to 422', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      expect(checkErrorMappings(error)).toBe(422);
    });
  });

  describe('Error Code Mappings', () => {
    it('should map ENOENT to 404', () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      expect(checkErrorMappings(error)).toBe(404);
    });

    it('should map EACCES to 403', () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EACCES';
      expect(checkErrorMappings(error)).toBe(403);
    });

    it('should map EPERM to 403', () => {
      const error = new Error('Operation not permitted') as any;
      error.code = 'EPERM';
      expect(checkErrorMappings(error)).toBe(403);
    });

    it('should map PostgreSQL error codes', () => {
      const error1 = new Error('Not null violation') as any;
      error1.code = '23502';
      expect(checkErrorMappings(error1)).toBe(400);

      const error2 = new Error('Unique violation') as any;
      error2.code = '23505';
      expect(checkErrorMappings(error2)).toBe(409);

      const error3 = new Error('Invalid text representation') as any;
      error3.code = '22P02';
      expect(checkErrorMappings(error3)).toBe(400);
    });
  });

  describe('No Mapping Cases', () => {
    it('should return null for unmapped error types', () => {
      const error = new Error('Generic error');
      expect(checkErrorMappings(error)).toBeNull();
    });

    it('should return null for unmapped error codes', () => {
      const error = new Error('Unknown error') as any;
      error.code = 'UNKNOWN_CODE';
      expect(checkErrorMappings(error)).toBeNull();
    });

    it('should return null when no name or code present', () => {
      const error = new Error('Simple error');
      error.name = '';
      expect(checkErrorMappings(error)).toBeNull();
    });
  });

  describe('Priority Testing', () => {
    it('should prioritize error name over error code', () => {
      const error = new TypeError('Type error with code') as any;
      error.code = 'ENOENT';
      expect(checkErrorMappings(error)).toBe(400); // TypeError wins over ENOENT
    });
  });
});
