import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { CreateUser } from '#types/service.types.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async (
  password: string
): Promise<string | undefined> => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error(`Error hashing the password ${e}`);
    throw new Error(`Error hashing the password ${e}`);
  }
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error(`Error comparing the password ${e}`);
    throw new Error(`Error comparing the password ${e}`);
  }
};

export const authenticateUser = async (email: string, password: string) => {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult[0];
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (e) {
    logger.error(`Error authenticating user: ${e instanceof Error ? e.message : e}`);
    throw e;
  }
};

export const createUser = async (userData: CreateUser) => {
  try {
    const { name, email, password, role } = userData;
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if ((await existingUser).length > 0) throw new Error('User already exists');
    const passwordHash = await hashPassword(password);
    if (!passwordHash) throw new Error('Error hashing the password');
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: passwordHash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return newUser;
    logger.info(`User ${newUser.email} created successfully`);
  } catch (e) {
    logger.error(`Error creating user ${e}`);
    throw e;
  }
};
