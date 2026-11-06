import express from 'express';
import * as schoolController from '../controllers/school.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
    .get(schoolController.getSchool)
    .put(restrictTo('school_admin', 'principal'), schoolController.updateSchool);

router.post('/logo', restrictTo('school_admin', 'principal'), upload.single('logo'), schoolController.uploadLogo);
router.delete('/logo', restrictTo('school_admin', 'principal'), schoolController.deleteLogo);

router.get('/users', schoolController.getUsers);

export default router;