import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) throw new AppError('Not authorized, no token provided', 401);

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if user still exists
    const user = await prisma.user.findUnique({ 
        where: { id: decoded.id },
        include: { school: true } 
    });
    
    if (!user) throw new AppError('User no longer exists', 401);
    if (!user.active) throw new AppError('Account deactivated', 403);

    req.user = user;
    req.schoolId = decoded.schoolId; // Multi-tenant isolation
    next();
});
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
        next();
    };
};