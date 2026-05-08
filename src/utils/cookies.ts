import { Response, CookieOptions, Request } from 'express';
export const cookies = {
  getOptions: (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  }),
  set: (
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ) => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },
  clear: (res: Response, name: string, options: CookieOptions = {}) => {
    res.clearCookie(name, { ...cookies.getOptions(), ...options });
  },
  get: (req: Request, name: string) => {
    return req.cookies[name];
  },
};
