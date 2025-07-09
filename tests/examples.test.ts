// Example: How to test auto-http-status in your own application

import { autoHttpStatus, AutoHttpStatus } from '../src/index';

describe('Auto HTTP Status Integration Examples', () => {
  
  // Example: Testing Express.js error middleware
  it('should work with Express.js error middleware', async () => {
    const mockError = new Error('User not found');
    const mockContext = {
      method: 'GET',
      path: '/api/users/123',
      params: { id: '123' }
    };

    const statusCode = await autoHttpStatus.getStatus(mockError, mockContext);
    expect(statusCode).toBe(404);
  });

  // Example: Testing with custom error classes
  it('should work with custom error classes', async () => {
    class ValidationError extends Error {
      public statusCode = 422;
      constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
      }
    }

    const error = new ValidationError('Invalid email format');
    const statusCode = await autoHttpStatus.getStatus(error);
    expect(statusCode).toBe(422); // Uses direct status code from error
  });

  // Example: Testing successful API responses
  it('should determine correct success codes', async () => {
    const newUser = { id: 1, name: 'John Doe' };
    const postContext = { method: 'POST' };
    
    const statusCode = await autoHttpStatus.getStatus(newUser, postContext);
    expect(statusCode).toBe(201); // Created
  });

  // Example: Testing with configuration
  it('should work with custom configuration', async () => {
    const customInstance = new AutoHttpStatus({
      // No LLM config - will use only local layers
    });

    const error = new TypeError('Invalid input type');
    const statusCode = await customInstance.getStatus(error);
    expect(statusCode).toBe(400);
  });

  // Example: Performance testing
  it('should handle high throughput', async () => {
    const errors = Array.from({ length: 1000 }, (_, i) => 
      new Error(`Error ${i}`)
    );

    const start = Date.now();
    const results = await Promise.all(
      errors.map(error => autoHttpStatus.getStatus(error))
    );
    const duration = Date.now() - start;

    expect(results).toHaveLength(1000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(results.every((code: number) => typeof code === 'number')).toBe(true);
  });
});

// Example: Testing with different frameworks

// Fastify example
async function fastifyErrorHandler(error: Error, request: any) {
  const context = {
    method: request.method,
    path: request.url
  };
  return await autoHttpStatus.getStatus(error, context);
}

// Koa example  
async function koaErrorHandler(ctx: any, error: Error) {
  const context = {
    method: ctx.method,
    path: ctx.path,
    params: ctx.params
  };
  const statusCode = await autoHttpStatus.getStatus(error, context);
  ctx.status = statusCode;
  ctx.body = { error: error.message };
}

describe('Framework Integration Examples', () => {
  it('should work with Fastify', async () => {
    const error = new Error('Resource not found');
    const mockRequest = { method: 'GET', url: '/api/resource/123' };
    
    const statusCode = await fastifyErrorHandler(error, mockRequest);
    expect(statusCode).toBe(404);
  });

  it('should work with Koa', async () => {
    const error = new Error('Permission denied');
    const mockCtx = {
      method: 'POST',
      path: '/api/admin',
      params: {},
      status: 0,
      body: null
    };

    await koaErrorHandler(mockCtx, error);
    expect(mockCtx.status).toBe(403);
    expect(mockCtx.body).toEqual({ error: 'Permission denied' });
  });
});
