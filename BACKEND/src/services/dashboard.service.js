import prisma from '../utils/prisma.js';

// Helper to get accurate local dates (Assuming server runs in UTC, adjusting for Lagos +1)
const getDateRanges = () => {
    const now = new Date();
    
    // Start of today (Local)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Start of yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // 7 days ago (including today, so 6 days ago start)
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    return { todayStart, yesterdayStart, sevenDaysAgo };
};

export const getDashboardData = async (schoolId) => {
    const { todayStart, yesterdayStart, sevenDaysAgo } = getDateRanges();

    // 1. Calculate Stats
    // Clinic Visits Today (Non-draft incidents today)
    const clinicVisitsToday = await prisma.incident.count({
        where: { schoolId, isDraft: false, occurredAt: { gte: todayStart } }
    });
    
    // Clinic Visits Yesterday (for change %)
    const clinicVisitsYesterday = await prisma.incident.count({
        where: { schoolId, isDraft: false, occurredAt: { gte: yesterdayStart, lt: todayStart } }
    });

    const visitsChangePercent = clinicVisitsYesterday === 0 
        ? 0 
        : Math.round(((clinicVisitsToday - clinicVisitsYesterday) / clinicVisitsYesterday) * 100);

    // Open Cases (Non-draft, status = open)
    const openCases = await prisma.incident.count({
        where: { schoolId, isDraft: false, status: 'open' }
    });

    // Medication Dispensed Today (Non-draft, status = administered today)
    const medicationDispensed = await prisma.incident.count({
        where: { schoolId, isDraft: false, status: 'administered', occurredAt: { gte: todayStart } }
    });
    
    // Medication Dispensed Yesterday
    const medicationYesterday = await prisma.incident.count({
        where: { schoolId, isDraft: false, status: 'administered', occurredAt: { gte: yesterdayStart, lt: todayStart } }
    });

    const medicationChangePercent = medicationYesterday === 0 
        ? 0 
        : Math.round(((medicationDispensed - medicationYesterday) / medicationYesterday) * 100);

    // 2. Recent Incidents (Top 3 non-draft)
    const recentIncidentsRaw = await prisma.incident.findMany({
        where: { schoolId, isDraft: false },
        take: 3,
        orderBy: { occurredAt: 'desc' },
        include: { student: true }
    });

    const recentIncidents = recentIncidentsRaw.map(inc => ({
        id: inc.id,
        studentName: inc.student.name,
        summary: inc.summary || 'No summary',
        className: inc.student.className,
        type: inc.type,
        status: inc.status,
        occurredAt: inc.occurredAt
    }));

    // 3. Weekly Activity (Last 7 days)
    const weeklyDataRaw = await prisma.incident.findMany({
        where: { schoolId, isDraft: false, occurredAt: { gte: sevenDaysAgo } },
        select: { occurredAt: true }
    });

    // Group by date manually to ensure we include days with 0 incidents
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const count = weeklyDataRaw.filter(inc => {
            if (!inc.occurredAt) return false;
            return inc.occurredAt.toISOString().split('T')[0] === dateStr;
        }).length;

        weeklyActivity.push({ date: dateStr, count });
    }

    // 4. Upcoming Trainings
    const upcomingTrainings = await prisma.trainingEvent.findMany({
        where: { schoolId, startsAt: { gte: new Date() } },
        take: 3,
        orderBy: { startsAt: 'asc' }
    });

    return {
        stats: {
            clinicVisitsToday: { value: clinicVisitsToday, changePercent: visitsChangePercent },
            openCases: { value: openCases },
            medicationDispensed: { value: medicationDispensed, changePercent: medicationChangePercent }
        },
        recentIncidents,
        weeklyActivity,
        upcomingTrainings
    };
};