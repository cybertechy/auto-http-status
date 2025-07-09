export function checkDirectStatus(input: unknown): number | null {
  if (input && typeof input === 'object' && ('statusCode' in input || 'status' in input)) {
    const status = (input as any).statusCode ?? (input as any).status;
    if (typeof status === 'number' && status >= 100 && status < 600) {
      return status;
    }
  }
  return null;
}
