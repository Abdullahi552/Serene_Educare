import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/conversations')
    .get(aiController.getConversations);

router.route('/conversations/:id')
    .get(aiController.getConversation)
    .delete(aiController.deleteConversation);

router.post('/chat', aiController.chat);

export default router;
