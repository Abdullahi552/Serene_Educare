import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/insights', reportController.getInsights);
router.route('/generated')
    .get(reportController.getGeneratedReports)
    .post(reportController.generateReport);

router.get('/generated/:id/download', reportController.downloadReport);

export default router;