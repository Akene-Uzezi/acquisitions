import { Router, Response, Request } from 'express';

import { register } from '#controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post('/login', (req: Request, res: Response) => {
  res.send('POST /api/auth/login response');
});

router.post('/logout', (req: Request, res: Response) => {
  res.send('POST /api/auth/logout response');
});

export default router;
