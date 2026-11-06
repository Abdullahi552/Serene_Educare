import * as schoolService from '../services/school.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getSchool = catchAsync(async (req, res) => {
    const school = await schoolService.getSchool(req.user.schoolId);
    res.status(200).json(school);
});

export const updateSchool = catchAsync(async (req, res) => {
    const school = await schoolService.updateSchool(req.user.schoolId, req.body);
    res.status(200).json(school);
});

export const uploadLogo = catchAsync(async (req, res) => {
    if (!req.file) throw new AppError('No logo uploaded', 400);
    const logoUrl = `/uploads/${req.file.filename}`;
    await schoolService.updateLogo(req.user.schoolId, logoUrl);
    res.status(200).json({ logoUrl });
});

export const deleteLogo = catchAsync(async (req, res) => {
    await schoolService.updateLogo(req.user.schoolId, null);
    res.status(204).send();
});

export const getUsers = catchAsync(async (req, res) => {
    const result = await schoolService.getSchoolUsers(req.user.schoolId, req.query);
    res.status(200).json(result);
});