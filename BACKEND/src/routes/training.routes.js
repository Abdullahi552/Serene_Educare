import express from 'express';
import * as trainingController from '../controllers/training.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/overview', trainingController.getOverview);
router.get('/courses', trainingController.getCourses);
router.post('/courses/:id/start', trainingController.startCourse);
router.post('/courses/:id/complete', trainingController.completeCourse);
router.get('/events', trainingController.getEvents);

export default router;