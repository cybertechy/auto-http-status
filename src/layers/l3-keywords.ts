const keywordMatchers: { regex: RegExp; status: number }[] = [
    { regex: /authentication required|missing or invalid token|jwt|unauthorized access|invalid credentials/i, status: 401 },
    { regex: /permission denied|unauthorized|access denied|insufficient privileges|forbidden/i, status: 403 },
    { regex: /not found|does not exist|resource not found|endpoint not found|route not found/i, status: 404 },
    { regex: /duplicate key|already exists|conflict|resource exists|unique constraint/i, status: 409 },
    { regex: /invalid input|validation failed|must be a|should be type|missing required field|invalid format/i, status: 400 },
    { regex: /bad request|malformed|invalid syntax|invalid json/i, status: 400 },
    { regex: /unprocessable entity|could not process|validation error|business rule violation/i, status: 422 },
    { regex: /rate limit|too many requests|quota exceeded|throttled/i, status: 429 },
    { regex: /timeout|timed out|request timeout|gateway timeout/i, status: 504 },
    { regex: /service unavailable|service is down|maintenance mode|temporarily unavailable/i, status: 503 },
    { regex: /internal server error|unexpected error|server error/i, status: 500 },
    { regex: /method not allowed|http method not supported/i, status: 405 },
    { regex: /unsupported media type|content type not supported/i, status: 415 },
    { regex: /payload too large|request entity too large|file too large/i, status: 413 },
    { regex: /precondition failed|if-match|if-none-match/i, status: 412 },
];

export function checkKeywordMatches(error: Error): number | null {
  for (const matcher of keywordMatchers) {
    if (matcher.regex.test(error.message)) {
      return matcher.status;
    }
  }
  return null;
}
