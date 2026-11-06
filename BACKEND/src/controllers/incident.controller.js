import * as incidentService from '../services/incident.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createIncident = catchAsync(async (req, res) => {
    const incident = await incidentService.createIncident(req.user.schoolId, req.user.id, req.body);
    res.status(201).json(incident);
});

export const getIncidents = catchAsync(async (req, res) => {
    const result = await incidentService.getIncidents(req.user.schoolId, req.query);
    res.status(200).json(result);
});

export const getIncident = catchAsync(async (req, res) => {
    const incident = await incidentService.getIncidentById(req.user.schoolId, req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);
    res.status(200).json(incident);
});

export const updateIncident = catchAsync(async (req, res) => {
    const incident = await incidentService.updateIncident(req.user.schoolId, req.params.id, req.body);
    res.status(200).json(incident);
});

export const uploadAttachment = catchAsync(async (req, res) => {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const attachment = await incidentService.addAttachment(req.user.schoolId, req.params.id, req.file);
    res.status(201).json(attachment);
});