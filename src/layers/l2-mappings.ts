const errorTypeMappings = new Map<string, number>([
    ['TypeError', 400],
    ['ReferenceError', 500],
    ['SyntaxError', 400],
    ['ValidationError', 422],
    ['RangeError', 400],
    ['URIError', 400],
    ['EvalError', 400],
    ['AggregateError', 500],
    ['TimeoutError', 408],
    ['AbortError', 499],
    ['NotFoundError', 404],
    ['UnauthorizedError', 401],
    ['ForbiddenError', 403],
    ['ConflictError', 409],
]);

const errorCodeMappings = new Map<string, number>([
    ['ENOENT', 404],
    ['EACCES', 403],
    ['EPERM', 403],
    ['ENOTFOUND', 404],
    ['ECONNREFUSED', 503],
    ['ETIMEDOUT', 408],
    ['ECONNRESET', 503],
    ['EHOSTUNREACH', 503],
    ['ENETUNREACH', 503],
    ['EMFILE', 503],
    ['ENFILE', 503],
    ['EADDRINUSE', 409],
    ['23502', 400],
    ['23505', 409],
    ['22P02', 400],
    ['42P01', 500],
    ['42703', 500],
    ['28P01', 401],
]);

export function checkErrorMappings(error: Error): number | null {
  if (error.name && errorTypeMappings.has(error.name)) {
    return errorTypeMappings.get(error.name)!;
  }
  if ('code' in error && typeof (error as any).code === 'string' && errorCodeMappings.has((error as any).code)) {
    return errorCodeMappings.get((error as any).code)!;
  }
  return null;
}
