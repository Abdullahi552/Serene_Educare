import express from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
    .get(incidentController.getIncidents)
    .post(incidentController.createIncident);

router.route('/:id')
    .get(incidentController.getIncident)
    .put(incidentController.updateIncident);

router.post('/:id/attachments', upload.single('file'), incidentController.uploadAttachment);

export default router;