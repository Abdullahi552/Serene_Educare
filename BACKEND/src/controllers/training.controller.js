import * as trainingService from '../services/training.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getOverview = catchAsync(async (req, res) => {
    const data = await trainingService.getTrainingOverview(req.user.schoolId, req.user.id);
    res.status(200).json(data);
});

export const getCourses = catchAsync(async (req, res) => {
    const data = await trainingService.getCourses(req.user.schoolId, req.user.id, req.query);
    res.status(200).json(data);
});

export const startCourse = catchAsync(async (req, res) => {
    await trainingService.updateCourseProgress(req.user.id, req.params.id, 'start');
    res.status(200).json({ message: 'Course started' });
});

export const completeCourse = catchAsync(async (req, res) => {
    await trainingService.updateCourseProgress(req.user.id, req.params.id, 'complete');
    res.status(200).json({ message: 'Course completed' });
});

export const getEvents = catchAsync(async (req, res) => {
    const data = await trainingService.getTrainingEvents(req.user.schoolId);
    res.status(200).json(data);
});