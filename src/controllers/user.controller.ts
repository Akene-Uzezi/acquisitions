import { Request, Response, NextFunction } from 'express';
import logger from '#config/logger.js';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.services.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#validations/format.js';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Getting users...');
    const allUsers = await getUsers();
    return res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error('Error getting users', e);
    next(e);
  }
};

export const getUserByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by id: ${id}`);

    const user = await getUserById(id);

    return res.json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (e: unknown) {
    logger.error('Error getting user by id', e);
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(e);
  }
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate userId param
    const paramResult = userIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(paramResult.error),
      });
    }

    // Validate request body
    const bodyResult = updateUserSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(bodyResult.error),
      });
    }

    const { id } = paramResult.data;
    const updates = bodyResult.data;

    logger.info(`Updating user ${id}...`);

    // Authenticated user can only update their own info
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Non-admin users can only update their own data
    if (authenticatedUser.id !== id && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to update this user',
      });
    }

    // Only admins can change the role of any user
    if (updates.role && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can change user roles',
      });
    }

    const updatedUser = await updateUser(id, updates);

    return res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e: unknown) {
    logger.error('Error updating user', e);
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(e);
  }
};

export const deleteUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Authenticated user can only delete their own account
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Non-admin users can only delete their own account
    if (authenticatedUser.id !== id && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to delete this user',
      });
    }

    logger.info(`Deleting user ${id}...`);

    await deleteUser(id);

    return res.json({
      message: 'User deleted successfully',
    });
  } catch (e: unknown) {
    logger.error('Error deleting user', e);
    if (e instanceof Error && e.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(e);
  }
};