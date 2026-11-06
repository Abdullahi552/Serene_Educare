import * as reportService from '../services/report.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getInsights = catchAsync(async (req, res) => {
    const data = await reportService.getInsights(req.user.schoolId, req.query);
    res.status(200).json(data);
});

export const getGeneratedReports = catchAsync(async (req, res) => {
    const data = await reportService.getGeneratedReports(req.user.schoolId);
    res.status(200).json(data);
});

export const generateReport = catchAsync(async (req, res) => {
    const report = await reportService.createGeneratedReport(req.user.schoolId, req.body);
    res.status(201).json(report);
});

export const downloadReport = catchAsync(async (req, res) => {
    // Stub: Just send a text file for now. 
    // In reality, you'd read the file from disk and stream it.
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send('id,name,date\n1,Test Student,2026-11-06');
});