import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

export const getActivitiesOverview = async (schoolId) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const allActivities = await prisma.activity.findMany({ where: { schoolId } });
    
    // Calculate stats
    const totalActivities = allActivities.length;
    const pendingAudits = allActivities.filter(a => a.category === 'safety' && a.status === 'pending').length;
    const upcomingEvents = allActivities.filter(a => a.category === 'event' && a.status === 'pending' && new Date(a.date) <= nextWeek).length;
    const nutritionSessions = allActivities.filter(a => a.category === 'nutrition').length;

    return {
        stats: {
            totalActivities: { value: totalActivities, changePercent: 0 },
            pendingAudits: { value: pendingAudits },
            upcomingEvents: { value: upcomingEvents },
            nutritionSessions: { value: nutritionSessions, changePercent: 0 }
        },
        categories: [
            { category: 'hygiene', title: 'Hygiene', subtitle: 'Latest check: 2 days ago', alert: false },
            { category: 'nutrition', title: 'Nutrition', subtitle: 'Next session: Tomorrow', alert: false },
            { category: 'safety', title: 'Safety', subtitle: pendingAudits > 0 ? 'Audit Overdue' : 'All clear', alert: pendingAudits > 0 },
            { category: 'event', title: 'Health Events', subtitle: 'Upcoming events scheduled', alert: false }
        ]
    };
};

export const getActivities = async (schoolId, query) => {
    const { category, status, search, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { schoolId };
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [activities, total] = await Promise.all([
        prisma.activity.findMany({
            where, skip, take: parseInt(limit),
            orderBy: { date: 'desc' },
            include: { assignee: { select: { id: true, name: true } } }
        }),
        prisma.activity.count({ where })
    ]);

    return {
        data: activities,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    };
};

export const createActivity = async (schoolId, data) => {
    const { title, category, date, assigneeId, status, notes } = data;
    
    return await prisma.activity.create({
        data: {
            schoolId, title, category, date: new Date(date), status: status || 'pending', notes,
            ...(assigneeId && { assignee: { connect: { id: assigneeId } } })
        },
        include: { assignee: { select: { id: true, name: true } } }
    });
};

export const updateActivity = async (schoolId, id, data) => {
    const existing = await prisma.activity.findFirst({ where: { id, schoolId } });
    if (!existing) throw new AppError('Activity not found', 404);

    return await prisma.activity.update({
        where: { id },
        data: {
            title: data.title,
            category: data.category,
            status: data.status,
            date: data.date ? new Date(data.date) : undefined,
            notes: data.notes,
            ...(data.assigneeId !== undefined && {
                assignee: data.assigneeId ? { connect: { id: data.assigneeId } } : { disconnect: true }
            })
        },
        include: { assignee: { select: { id: true, name: true } } }
    });
};

export const deleteActivity = async (schoolId, id) => {
    const existing = await prisma.activity.findFirst({ where: { id, schoolId } });
    if (!existing) throw new AppError('Activity not found', 404);
    await prisma.activity.delete({ where: { id } });
};