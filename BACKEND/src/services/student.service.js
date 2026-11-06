import prisma from '../utils/prisma.js';

export const getStudents = async (schoolId, query) => {
    const { search, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 500);

    const where = { schoolId };
    if (search) {
        const cleanSearch = search.replace(/^#/, ''); // Remove leading # if present
        where.OR = [
            { name: { contains: cleanSearch, mode: 'insensitive' } },
            { admissionNo: { contains: cleanSearch, mode: 'insensitive' } }
        ];
    }

    const [students, total] = await Promise.all([
        prisma.student.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
        prisma.student.count({ where })
    ]);

    return {
        data: students,
        pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    };
};

export const getStudentById = async (schoolId, id) => {
    return await prisma.student.findFirst({ where: { id, schoolId } });
};