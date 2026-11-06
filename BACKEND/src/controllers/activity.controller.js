import * as activityService from '../services/activity.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getOverview = catchAsync(async (req, res) => {
    const data = await activityService.getActivitiesOverview(req.user.schoolId);
    res.status(200).json(data);
});

export const getActivities = catchAsync(async (req, res) => {
    const data = await activityService.getActivities(req.user.schoolId, req.query);
    res.status(200).json(data);
});

export const createActivity = catchAsync(async (req, res) => {
    const data = await activityService.createActivity(req.user.schoolId, req.body);
    res.status(201).json(data);
});

export const updateActivity = catchAsync(async (req, res) => {
    const data = await activityService.updateActivity(req.user.schoolId, req.params.id, req.body);
    res.status(200).json(data);
});

export const deleteActivity = catchAsync(async (req, res) => {
    await activityService.deleteActivity(req.user.schoolId, req.params.id);
    res.status(204).send();
});