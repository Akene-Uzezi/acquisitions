import logger from '#config/logger.js';
import { createUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
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
    const { name, email, password, role } = validationResult.data;
    //AUTH SERVICE
    const userData = { name, email, password, role };
    const user = await createUser(userData);

    const token = await jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (!token) throw new Error('Error signing the token');

    cookies.set(res, 'token', token);

    logger.info('User registration successful');
    res.status(201).json({
      message: 'User Registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
