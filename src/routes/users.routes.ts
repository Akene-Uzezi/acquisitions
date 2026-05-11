import { Router } from 'express';
import {
  getAllUsers,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from '#controllers/user.controller.js';

const router = Router();

router.get('/', getAllUsers);
router.get('/:id', getUserByIdHandler);
router.put('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;