import express from 'express';
import * as studentController from '../controllers/student.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudent);

export default router;