import { RequestContext } from '../types';

/**
 * Checks the request context and input to determine a suitable HTTP status code.
 * 
 * @param input - The input to check, can be an Error or any other value.
 * @param context - The request context containing method, path, etc.
 * @returns A suitable HTTP status code or null if no specific logic applies.
 */

export function checkContextLogic(input: unknown, context: RequestContext): number | null {
  if (!(input instanceof Error) && (input === null || input === undefined)) {
    if (context.method?.toUpperCase() === 'GET' && context.params && Object.keys(context.params).length > 0) {
      return 404;
    }
  }
  
  if (!(input instanceof Error)) {
    switch (context.method?.toUpperCase()) {
      case 'POST':
        return 201;
      case 'DELETE':
        return 204;
      default:
        return 200;
    }
  }
  
  return null;
}
