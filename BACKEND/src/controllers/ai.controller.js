import * as aiService from '../services/ai.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getConversations = catchAsync(async (req, res) => {
    const data = await aiService.getConversations(req.user.schoolId, req.user.id);
    res.status(200).json({ data });
});

export const getConversation = catchAsync(async (req, res) => {
    const data = await aiService.getConversationById(req.user.schoolId, req.user.id, req.params.id);
    res.status(200).json(data);
});

export const deleteConversation = catchAsync(async (req, res) => {
    await aiService.deleteConversation(req.user.schoolId, req.user.id, req.params.id);
    res.status(204).send();
});

export const chat = catchAsync(async (req, res) => {
    const data = await aiService.sendMessage(req.user.schoolId, req.user.id, req.body);
    res.status(200).json(data);
});