import logger from '#config/logger.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
import { registerSchema, logInSchema } from '#validations/auth.validation.js';
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

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = logInSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { email, password } = validationResult.data;
    const user = await authenticateUser(email, password);

    const token = await jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (!token) throw new Error('Error signing the token');

    cookies.set(res, 'token', token);

    logger.info('User login successful');
    res.status(200).json({
      message: 'User Logged In',
      user,
    });
  } catch (e: unknown) {
    logger.error('Signin error', e);
    if (e instanceof Error && (e.message === 'User not found' || e.message === 'Invalid password')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    next(e);
  }
};

export const signout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    cookies.clear(res, 'token');
    logger.info('User logout successful');
    res.status(200).json({
      message: 'User Logged Out',
    });
  } catch (e: unknown) {
    logger.error('Signout error', e);
    next(e);
  }
};
