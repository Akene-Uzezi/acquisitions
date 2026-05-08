import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { CustomSlidingWindowLimitOptions } from '#types/middleware.types.js';
import { slidingWindow } from '@arcjet/node';
import { Request, Response, NextFunction } from 'express';

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = req.user?.role || 'guest';
    let limit: number;
    let message: string;
    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded. Slow down';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded. Slow down';
        break;
      case 'guest':
        limit = 5;
        message = 'Guest request limit exceeded. Slow down';
        break;
    }
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      } as CustomSlidingWindowLimitOptions)
    );
    const decision = await client.protect(req);
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated Requests are not allowed',
      });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated Requests are not allowed',
      });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated Requests are not allowed',
      });
    }
    next();
  } catch (e) {
    console.log('Arcjet Middleware error', e);
    res.status(500).json({
      error: 'Internal server Error',
      message: 'Something went wrong with security middleware',
    });
  }
};

export default securityMiddleware;
