import express from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/overview', activityController.getOverview);
router.route('/')
    .get(activityController.getActivities)
    .post(activityController.createActivity);
router.route('/:id')
    .put(activityController.updateActivity)
    .delete(activityController.deleteActivity);

export default router;