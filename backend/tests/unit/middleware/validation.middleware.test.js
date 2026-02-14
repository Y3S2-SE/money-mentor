import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.unstable_mockModule('express-validator', () => ({
  validationResult: jest.fn()
}));


const { validationResult } =  await import ('express-validator');
const { validate } = await import ('../../../middleware/validation.middleware.js');


describe('Validation Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() when validation passes', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 when validation fails', () => {
    const errors = [
      { path: 'email', msg: 'Invalid email' },
      { path: 'password', msg: 'Password too short' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'validation failed',
      errors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should format multiple validation errors correctly', () => {
    const errors = [
      { path: 'username', msg: 'Username is required' },
      { path: 'email', msg: 'Email is required' },
      { path: 'password', msg: 'Password is required' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors
    });

    validate(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'validation failed',
      errors: expect.arrayContaining([
        { field: 'username', message: 'Username is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ])
    });
  });
});