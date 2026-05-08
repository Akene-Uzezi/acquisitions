import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: async (payload: string | object | Buffer) => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (err) {
      logger.error('failed to authenticate token', err);
    }
  },
  verify: (token: string) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('failed to authenticate token', e);
      throw new Error('Failed to authenticate token');
    }
  },
};
