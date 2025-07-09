import { checkDirectStatus } from '../src/layers/l1-direct';

describe('Layer 1 - Direct Status Detection', () => {
  it('should return status code from statusCode property', () => {
    const input = { statusCode: 404 };
    expect(checkDirectStatus(input)).toBe(404);
  });

  it('should return status code from status property', () => {
    const input = { status: 403 };
    expect(checkDirectStatus(input)).toBe(403);
  });

  it('should prefer statusCode over status', () => {
    const input = { statusCode: 404, status: 500 };
    expect(checkDirectStatus(input)).toBe(404);
  });

  it('should return null for invalid status codes', () => {
    expect(checkDirectStatus({ statusCode: 99 })).toBeNull();
    expect(checkDirectStatus({ statusCode: 600 })).toBeNull();
    expect(checkDirectStatus({ statusCode: 'invalid' })).toBeNull();
  });

  it('should return null for non-object input', () => {
    expect(checkDirectStatus('string')).toBeNull();
    expect(checkDirectStatus(123)).toBeNull();
    expect(checkDirectStatus(null)).toBeNull();
    expect(checkDirectStatus(undefined)).toBeNull();
  });

  it('should return null for objects without status properties', () => {
    expect(checkDirectStatus({ message: 'error' })).toBeNull();
    expect(checkDirectStatus({})).toBeNull();
  });

  it('should handle valid HTTP status code ranges', () => {
    expect(checkDirectStatus({ statusCode: 100 })).toBe(100);
    expect(checkDirectStatus({ statusCode: 200 })).toBe(200);
    expect(checkDirectStatus({ statusCode: 300 })).toBe(300);
    expect(checkDirectStatus({ statusCode: 400 })).toBe(400);
    expect(checkDirectStatus({ statusCode: 500 })).toBe(500);
    expect(checkDirectStatus({ statusCode: 599 })).toBe(599);
  });
});
