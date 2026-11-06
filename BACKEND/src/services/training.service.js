import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

export const getTrainingOverview = async (schoolId, userId) => {
    // Fetch all courses and user progress
    const courses = await prisma.course.findMany({
        include: { progress: { where: { userId } } }
    });

    let mandatoryTotal = 0;
    let mandatoryCompleted = 0;
    let certificates = 0;
    let latestCertificate = null;
    let learningMinutes = 0;
    let thisWeekMinutes = 0;
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    courses.forEach(c => {
        const progress = c.progress[0];
        if (c.mandatory) {
            mandatoryTotal++;
            if (progress?.status === 'completed') mandatoryCompleted++;
        }
        if (progress?.status === 'completed') {
            certificates++;
            if (c.title) latestCertificate = c.title;
        }
        if (progress) {
            learningMinutes += progress.minutesSpent || 0;
            if (progress.updatedAt >= startOfWeek) {
                thisWeekMinutes += progress.minutesSpent || 0;
            }
        }
    });

    return {
        stats: {
            mandatory: { completed: mandatoryCompleted, total: mandatoryTotal },
            learningHours: { value: Number((learningMinutes / 60).toFixed(1)), thisWeek: Number((thisWeekMinutes / 60).toFixed(1)) },
            certificates: { count: certificates, latest: latestCertificate }
        }
    };
};

export const getCourses = async (schoolId, userId, query) => {
    const { filter, search } = query;
    let where = {};
    
    if (filter === 'mandatory') where.mandatory = true;
    if (filter === 'optional') where.mandatory = false;
    if (filter === 'documents') where.type = { in: ['guide', 'document'] };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const courses = await prisma.course.findMany({
        where,
        include: { progress: { where: { userId } } }
    });

    return {
        data: courses.map(c => ({
            id: c.id, title: c.title, description: c.description, type: c.type,
            durationMinutes: c.durationMinutes, mandatory: c.mandatory,
            contentUrl: c.contentUrl,
            status: c.progress[0]?.status || 'not_started',
            progressPercent: c.progress[0]?.progressPercent || 0
        }))
    };
};

export const updateCourseProgress = async (userId, courseId, action) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Course not found', 404);

    const existingProgress = await prisma.courseProgress.findUnique({
        where: { userId_courseId: { userId, courseId } }
    });

    if (action === 'start') {
        if (existingProgress) return existingProgress; // already started
        return await prisma.courseProgress.create({
            data: { userId, courseId, status: 'in_progress', progressPercent: 10 }
        });
    } 
    
    if (action === 'complete') {
        return await prisma.courseProgress.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { status: 'completed', progressPercent: 100, completedAt: new Date() },
            create: { userId, courseId, status: 'completed', progressPercent: 100, completedAt: new Date() }
        });
    }
};

export const getTrainingEvents = async (schoolId) => {
    const events = await prisma.trainingEvent.findMany({
        where: { schoolId, startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' }
    });
    return { data: events };
};