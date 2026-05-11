import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const getUsers = async (): Promise<
  {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: Date | null;
    updatedAt: Date | null;
  }[]
> => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
  } catch (e) {
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async (id: number): Promise<{
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
} | null> => {
  try {
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    return userResult[0];
  } catch (e) {
    logger.error(`Error getting user by id ${id}: ${e}`);
    throw e;
  }
};

export const updateUser = async (
  id: number,
  updates: { name?: string; email?: string; role?: string }
): Promise<{
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}> => {
  try {
    const existingUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    logger.info(`User ${id} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user ${id}: ${e}`);
    throw e;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
  } catch (e) {
    logger.error(`Error deleting user ${id}: ${e}`);
    throw e;
  }
};