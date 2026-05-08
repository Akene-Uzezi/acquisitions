import logger from '#config/logger.js';
import { registerSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#validations/format.js';
import { Response, Request, NextFunction } from 'express';
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, role } = validationResult.data;
    //AUTH SERVICE

    logger.info('User registration successful');
    res.status(201).json({
      message: 'User Registered',
      user: {
        id: 1,
        name,
        email,
        role,
      },
    });
  } catch (e: unknown) {
    logger.error('Signup error', e);
    if (e instanceof Error && e.message === 'User already exists') {
      return res.status(409).json({ message: 'User already exists' });
    }
    next(e);
  }
};
