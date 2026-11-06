import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';

const generateIncidentRef = async () => {
    const counter = await prisma.counter.upsert({
        where: { name: 'incident' },
        update: { value: { increment: 1 } },
        create: { name: 'incident', value: 1 }
    });
    return `INC-${counter.value.toString().padStart(6, '0')}`;
};

export const createIncident = async (schoolId, userId, data) => {
    const { studentId, type, location, occurredAt, description, firstAid, notifyParent, isDraft } = data;

    // Validate Draft Rules
    if (!isDraft) {
        if (!location || !occurredAt || !description || description.length < 10) {
            throw new AppError('Validation failed', 422, null, {
                description: 'Description must be at least 10 characters for submitted reports.',
                location: !location ? 'Required' : undefined,
                occurredAt: !occurredAt ? 'Required' : undefined
            });
        }
    }

    const reference = await generateIncidentRef();

    return await prisma.incident.create({
        data: {
            reference,
            type,
            location: location || null,
            occurredAt: occurredAt ? new Date(occurredAt) : null,
            description,
            firstAid: firstAid || [],
            notifyParent: notifyParent || false,
            isDraft: isDraft || false,
            status: 'open',
            summary: description ? description.substring(0, 40) : null,
            
            // Use connect for relations
            school: { connect: { id: schoolId } },
            reportedBy: { connect: { id: userId } },
            student: { connect: { id: studentId } }
        }
    });
};
export const getIncidents = async (schoolId, query) => {
    const { search, type, status, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { schoolId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { reference: { contains: search, mode: 'insensitive' } },
            { student: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }

    const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { occurredAt: 'desc' },
            include: { student: true, reportedBy: { select: { id: true, name: true } } }
        }),
        prisma.incident.count({ where })
    ]);

    // Format for list view (remove description & attachments as per contract)
    const formattedList = incidents.map(inc => {
        const { description, attachments, ...listRow } = inc;
        return listRow;
    });

    return {
        data: formattedList,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    };
};

export const getIncidentById = async (schoolId, id) => {
    return await prisma.incident.findFirst({
        where: { id, schoolId },
        include: { student: true, reportedBy: { select: { id: true, name: true } }, attachments: true }
    });
};

export const updateIncident = async (schoolId, id, data) => {
    const incident = await prisma.incident.findFirst({ where: { id, schoolId } });
    if (!incident) throw new AppError('Incident not found', 404);

    return await prisma.incident.update({
        where: { id },
        data: {
            status: data.status,
            description: data.description,
            location: data.location,
            occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
            firstAid: data.firstAid,
            notifyParent: data.notifyParent,
            isDraft: data.isDraft
        },
        include: { student: true, reportedBy: { select: { id: true, name: true } }, attachments: true }
    });
};

export const addAttachment = async (schoolId, incidentId, file) => {
    const incident = await prisma.incident.findFirst({ where: { id: incidentId, schoolId } });
    if (!incident) throw new AppError('Incident not found', 404);

    return await prisma.incidentAttachment.create({
        data: {
            incidentId,
            name: file.originalname,
            url: `/uploads/incidents/${file.filename}`,
            sizeBytes: file.size
        }
    });
};