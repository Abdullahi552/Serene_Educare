import * as studentService from '../services/student.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getStudents = catchAsync(async (req, res) => {
    const result = await studentService.getStudents(req.user.schoolId, req.query);
    res.status(200).json(result);
});

export const getStudent = catchAsync(async (req, res) => {
    const student = await studentService.getStudentById(req.user.schoolId, req.params.id);
    if (!student) throw new AppError('Student not found', 404);
    res.status(200).json(student);
});