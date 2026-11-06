import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

export const getSchool = async (schoolId) => {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new AppError('School not found', 404);
    return school;
};

export const updateSchool = async (schoolId, data) => {
    // Exclude logoUrl from the general update, handle it via dedicated endpoint
    const { logoUrl, id, createdAt, updatedAt, ...updateData } = data;
    
    return await prisma.school.update({
        where: { id: schoolId },
        data: updateData
    });
};

export const updateLogo = async (schoolId, logoUrl) => {
    return await prisma.school.update({
        where: { id: schoolId },
        data: { logoUrl }
    });
};

export const getSchoolUsers = async (schoolId, query) => {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: { schoolId },
            skip, take: parseInt(limit),
            select: { id: true, name: true, email: true, role: true, active: true, updatedAt: true }
        }),
        prisma.user.count({ where: { schoolId } })
    ]);

    // Map to match the contract shape
    const formattedUsers = users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        status: u.active ? 'active' : 'offline',
        lastActiveAt: u.updatedAt
    }));

    return {
        data: formattedUsers,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    };
};