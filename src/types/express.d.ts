import { CreateUser } from '#types/service.types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: CreateUser;
    }
  }
}

export {};
