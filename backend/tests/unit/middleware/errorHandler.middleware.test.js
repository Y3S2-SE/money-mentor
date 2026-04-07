import { describe, it, expect, jest } from '@jest/globals';
import { notFound, errorHandler } from '../../../middleware/errorHandler.js';

// ── notFound ───────────────────────────────────────────────────────
describe('notFound middleware', () => {
  it('should set 404 and call next with a Not Found error', () => {
    const req = { originalUrl: '/api/unknown' };
    const res = { status: jest.fn().mockReturnThis() };
    const next = jest.fn();

    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('/api/unknown');
  });
});

// ── errorHandler ───────────────────────────────────────────────────
describe('errorHandler middleware', () => {
  it('should respond with the current status code and error message', () => {
    const err = new Error('Something went wrong');
    const req = {};
    const res = {
      statusCode: 400,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong',
    });
  });

  it('should default to 500 when status is 200', () => {
    const err = new Error('Unexpected failure');
    const req = {};
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include the error message in the response', () => {
    const err = new Error('Custom error message');
    const req = {};
    const res = {
      statusCode: 422,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Custom error message');
    expect(jsonArg.success).toBe(false);
  });
});