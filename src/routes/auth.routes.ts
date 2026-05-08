import { Router } from 'express';

import { register, signin, signout } from '#controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post('/login', signin);

router.post('/logout', signout);

export default router;
