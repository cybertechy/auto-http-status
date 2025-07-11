# Auto HTTP Status

A lightweight, zero-dependency Node.js library to automatically determine the correct HTTP status code from errors and data. It uses a layered approach of heuristics and pattern matching for high performance, with an optional AI-powered layer for complex cases.

This library helps you write cleaner error handling logic and create more consistent, standards-compliant APIs without the boilerplate.

## Features

- **Multi-Layered Approach:** Uses 5 layers of analysis for accuracy and speed.
- **Framework Agnostic:** Works with Express, Fastify, Koa, NestJS, or any Node.js framework.
- **TypeScript Native:** Written in TypeScript with full type support.
- **ESM & CJS Compatible:** Works with modern ES Modules and classic CommonJS.
- **Zero Dependencies:** The core library has no external dependencies.
- **Optional LLM Integration:** Can be configured to use OpenAI's API for a final layer of analysis on ambiguous errors.

## The 5 Layers of Analysis

The library processes input through the following layers, stopping at the first one that returns a definitive code:

1.  **Direct Status Code:** Checks for a `statusCode` or `status` property on the error object.
2.  **Error Type Matching:** Maps standard error types (`TypeError`) and common library error names (`ValidationError`) to status codes.
3.  **Keyword Heuristics:** Uses optimized regular expressions to scan the error message for keywords (e.g., "not found" -> 404, "permission denied" -> 403).
4.  **Context-Aware Logic:** Analyzes the HTTP request context. For example, it returns `201 Created` for successful `POST` requests or `404 Not Found` if a `GET` request to a specific resource returns `null`.
5.  **LLM-Powered Analysis (Optional):** If enabled, sends the error and context to an LLM (like OpenAI's GPT) for an intelligent recommendation.

## Installation

```bash
npm install auto-http-status
```

### Module Compatibility

This package supports both ES Modules (ESM) and CommonJS:

```javascript
// ES Modules (modern)
import { AutoHttpStatus, autoHttpStatus } from 'auto-http-status';

// CommonJS (traditional)
const { AutoHttpStatus, autoHttpStatus } = require('auto-http-status');
```

## Quick Start

You can use the default, pre-configured instance for immediate use. Here is an example of an Express.js error-handling middleware.

```javascript
import express from 'express';
import { autoHttpStatus } from './src/index'; // In your project: from 'auto-http-status'

const app = express();

// Your routes...
app.get('/users/:id', (req, res) => {
  if (req.params.id === '1') {
    res.json({ id: 1, name: 'John Doe' });
  } else {
    // This error will be caught by the middleware
    throw new Error('User with that ID was not found.');
  }
});

// Error-handling middleware
app.use(async (err, req, res, next) => {
  if (err) {
    // Create context for more accurate results
    const context = {
      method: req.method,
      path: req.path,
      params: req.params,
    };

    // Get the status code
    const statusCode = await autoHttpStatus.getStatus(err, context);

    console.log(`Error: "${err.message}" -> Status: ${statusCode}`); // "Error: "User...not found." -> Status: 404"

    res.status(statusCode).json({
      error: {
        message: err.message,
        status: statusCode,
      },
    });
  } else {
    next();
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Usage

### Handling Successful Responses

The library isn't just for errors. You can pass successful data to it to get the correct success code (`200` vs. `201`).

```javascript
// In a POST route
const newUser = { id: 2, name: 'Jane Doe' };
const context = { method: 'POST' };
const statusCode = await autoHttpStatus.getStatus(newUser, context); // -> 201

res.status(statusCode).json(newUser);
```

### Using the Optional LLM Layer

The LLM layer can be enabled in two ways:

#### Option 1: Environment Variables (Recommended)

Create a `.env` file in your project root:

```bash
# Required: Your LLM API key
LLM_API_KEY=your_openai_api_key_here

# Optional: Specific model (defaults to gpt-4.1-nano-2025-04-14)
LLM_MODEL=gpt-4.1-nano-2025-04-14

# Optional: Custom API URL (defaults to OpenAI's endpoint)
LLM_API_URL=https://api.openai.com/v1/chat/completions
```

The library will automatically detect these environment variables and enable the LLM layer:

```javascript
import { autoHttpStatus } from 'auto-http-status';

// LLM layer automatically enabled if environment variables are set
const statusCode = await autoHttpStatus.getStatus(error, context);
```

#### Option 2: Manual Configuration

**Warning:** This will make API calls to an external service, which has cost and latency implications. It should be used judiciously.

```javascript
import { AutoHttpStatus } from 'auto-http-status';

// Configure with your provider settings
const proStatus = new AutoHttpStatus({
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4.1-nano-2025-04-14', 
    apiUrl: 'https://api.openai.com/v1/chat/completions'
  },
});

// Now use this instance instead of the default one
const statusCode = await proStatus.getStatus(AmbiguousError);
```

## API Reference

### `new AutoHttpStatus(config?)`

Creates a new instance.

-   `config` (optional `AutoHttpStatusConfig`): Configuration object.
    -   `llm` (optional `LlmConfig`): Configuration for the LLM provider.

### `instance.getStatus(input, context?)`

The main method to get a status code.

-   `input` (`unknown`): The error object, data, or other value to analyze.
-   `context` (optional `RequestContext`): The HTTP request context.
    -   `method` (`string`)
    -   `path` (`string`)
    -   `body` (`any`)
    -   `params` (`any`)
    -   `query` (`any`)
-   **Returns:** `Promise<number>` - The determined HTTP status code.

## Testing

The library includes a comprehensive test suite with 94 tests covering all functionality:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
- 100% statement coverage
- 98.43% branch coverage  
- 100% function coverage
- 100% line coverage

## License

MIT
