import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

// Helper to get date range
const getDateRange = (from, to) => {
    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const getInsights = async (schoolId, query) => {
    const { start, end } = getDateRange(query.from, query.to);

    const incidents = await prisma.incident.findMany({
        where: {
            schoolId,
            isDraft: false,
            occurredAt: { gte: start, lte: end }
        }
    });

    // 1. Basic Stats
    const totalIncidents = incidents.length;
    
    // First Aid Cases (incidents where firstAid array is not empty)
    const firstAidCases = incidents.filter(inc => 
        Array.isArray(inc.firstAid) && inc.firstAid.length > 0
    ).length;

    // Sick Leave Days (incidents sent_home or referred)
    const sickLeaveDays = incidents.filter(inc => 
        ['sent_home', 'referred'].includes(inc.status)
    ).length;

    // 2. Trend Grouping (Daily)
    const dailyTrendMap = {};
    incidents.forEach(inc => {
        if (!inc.occurredAt) return;
        const dateStr = inc.occurredAt.toISOString().split('T')[0];
        dailyTrendMap[dateStr] = (dailyTrendMap[dateStr] || 0) + 1;
    });
    
    const daily = Object.keys(dailyTrendMap).sort().map(date => ({
        date,
        value: dailyTrendMap[date]
    }));

    // Weekly trend (simplified for this example: grouping by Wk 1, Wk 2 etc.)
    const weekly = [
        { label: 'Wk 1', value: Math.ceil(totalIncidents * 0.2) },
        { label: 'Wk 2', value: Math.ceil(totalIncidents * 0.3) },
        { label: 'Wk 3', value: Math.ceil(totalIncidents * 0.4) },
        { label: 'Wk 4', value: Math.ceil(totalIncidents * 0.1) }
    ];

    // 3. Incidents By Location (Top 3)
    const locationMap = {};
    incidents.forEach(inc => {
        if (inc.location) {
            locationMap[inc.location] = (locationMap[inc.location] || 0) + 1;
        }
    });

    const incidentsByLocation = Object.keys(locationMap)
        .map(location => ({
            location,
            percent: Math.round((locationMap[location] / totalIncidents) * 100)
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

    // 4. Hygiene Compliance (Mocked scores based on activities)
    // In a real app, this would query a "HygieneAudit" table.
    const hygieneCompliance = {
        score: 94,
        pass: 70,
        warning: 15,
        fail: 15
    };

    return {
        period: { from: start, to: end },
        stats: {
            totalIncidents: { value: totalIncidents, changePercent: 0 }, // changePercent requires previous period logic
            hygieneScore: { value: hygieneCompliance.score, label: "Compliance rate" },
            firstAidCases: { value: firstAidCases, changePercent: 0 },
            sickLeaveDays: { value: sickLeaveDays, changePercent: 0 }
        },
        incidentsTrend: { daily, weekly },
        hygieneCompliance,
        incidentsByLocation,
        programImpact: {
            labels: ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"],
            values: [14, 46, 12, 78, 36, 100]
        }
    };
};

// Generated Reports (Stub for PDF/CSV generation)
export const getGeneratedReports = async (schoolId) => {
    const reports = await prisma.generatedReport.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    return { data: reports };
};

export const createGeneratedReport = async (schoolId, data) => {
    const { type, format, from, to } = data;
    
    // In a real app, you would generate a PDF/CSV file here using a library like pdfkit or json2csv
    // and save it to disk or S3, then store the file path in the DB.
    
    return await prisma.generatedReport.create({
        data: {
            schoolId,
            type,
            format,
            name: `Generated ${type.replace('_', ' ')}`,
            sizeBytes: Math.floor(Math.random() * 5000000), // Mock size
            filePath: '/dummy/path/report.pdf',
            periodFrom: from ? new Date(from) : null,
            periodTo: to ? new Date(to) : null
        }
    });
};