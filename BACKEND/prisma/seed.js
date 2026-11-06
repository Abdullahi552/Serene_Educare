import bcrypt from 'bcryptjs';
import prisma from '../src/utils/prisma.js';

async function main() {
    console.log('🌱 Starting massive database seed...');

    // 1. Clear existing data (Reverse dependency order)
    await prisma.aiMessage.deleteMany({});
    await prisma.aiConversation.deleteMany({});
    await prisma.incidentAttachment.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.courseProgress.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.generatedReport.deleteMany({});
    await prisma.trainingEvent.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.school.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.counter.deleteMany({});

    // 2. Create School
    const school = await prisma.school.create({
        data: {
            name: 'Nectar Schools',
            schoolCode: 'DST-8842',
            physicalAddress: 'Block 2-3, Anthony Street, Lagos Island, Lagos',
            contact: { name: 'Busola Alao', jobTitle: 'School Health Manager', emergencyEmail: 'health@nectarschools.com.ng' }
        }
    });

    // 3. Create Users (All Roles)
    const passwordHash = await bcrypt.hash('password123', 12);
    const usersData = [
        { name: 'Busola Alao', email: 'admin1@nectarschools.com', role: 'school_admin', title: 'School Health Manager' },
        { name: 'Sarah Adebayo', email: 'principal@nectarschools.com', role: 'principal', title: 'Principal' },
        { name: 'Nurse Joy', email: 'nurse@nectarschools.com', role: 'school_nurse', title: 'Head Nurse' },
        { name: 'David Akanfe', email: 'counselor@nectarschools.com', role: 'counselor', title: 'Student Counselor' },
        { name: 'Mr. Femi', email: 'teacher@nectarschools.com', role: 'teacher', title: 'JSS 1 Teacher' }
    ];

    const users = [];
    for (const u of usersData) {
        const user = await prisma.user.create({
            data: { ...u, schoolId: school.id, passwordHash }
        });
        users.push(user);
    }
    console.log('✅ Users created (Password: password123)');

    // 4. Create Students
    const studentsData = [
        { name: 'Femi Sanusi', admissionNo: '41325', className: 'JSS 1' },
        { name: 'Mariam Balogun', admissionNo: '41326', className: 'Basic 5' },
        { name: 'Chidi Okeke', admissionNo: '41327', className: 'SS 2' },
        { name: 'Aisha Bello', admissionNo: '41328', className: 'JSS 3' },
        { name: 'Tunde Bakare', admissionNo: '41329', className: 'Basic 4' },
        { name: 'Ngozi Eze', admissionNo: '41330', className: 'SS 1' },
        { name: 'Ibrahim Musa', admissionNo: '41331', className: 'JSS 2' },
        { name: 'Oluwaseun Adeyemi', admissionNo: '41332', className: 'Basic 6' },
        { name: 'Funke Akindele', admissionNo: '41333', className: 'SS 3' },
        { name: 'Yusuf Ali', admissionNo: '41334', className: 'JSS 1' },
        { name: 'Fatima Abubakar', admissionNo: '41335', className: 'Basic 5' },
        { name: 'Emeka Nwosu', admissionNo: '41336', className: 'SS 2' },
        { name: 'Bisi Adebayo', admissionNo: '41337', className: 'JSS 3' },
        { name: 'Kelechi Obi', admissionNo: '41338', className: 'Basic 4' },
        { name: 'Zainab Bello', admissionNo: '41339', className: 'SS 1' },
    ];

    const students = [];
    for (const s of studentsData) {
        const student = await prisma.student.create({
            data: { ...s, schoolId: school.id, guardianName: 'Mr. ' + s.name.split(' ')[1] }
        });
        students.push(student);
    }
    console.log(`✅ ${students.length} Students created`);

    // 5. Create Incidents (Mix of past 45 days)
    const incidentTypes = ['injury', 'illness', 'safety'];
    const locations = ['Playground', 'Classroom', 'Cafeteria', 'Sports Field', 'Hallway'];
    const statuses = ['open', 'treated', 'sent_home', 'referred', 'closed'];
    
    // Set counter for INC numbers
    await prisma.counter.create({ data: { name: 'incident', value: 40 } });

    for (let i = 0; i < 40; i++) {
        // Random date in the last 45 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 45));

        await prisma.incident.create({
            data: {
                schoolId: school.id,
                reportedById: users[Math.floor(Math.random() * users.length)].id,
                studentId: students[Math.floor(Math.random() * students.length)].id,
                reference: `INC-${(i + 1).toString().padStart(6, '0')}`,
                type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                occurredAt: date,
                description: 'Student reported feeling unwell or sustained a minor injury during school hours.',
                summary: i % 3 === 0 ? 'Scraped Knee' : i % 3 === 1 ? 'Fever (101°F)' : 'Sprained Ankle',
                status: statuses[Math.floor(Math.random() * statuses.length)],
                isDraft: i > 35, // last 5 are drafts
                firstAid: i % 2 === 0 ? ['ice_pack', 'bandage_dressing'] : []
            }
        });
    }
    console.log('✅ 40 Incidents created');

    // 6. Create Activities
    const activitiesData = [
        { title: 'Monthly Water Tank Cleaning', category: 'hygiene', status: 'completed', date: new Date(Date.now() - 2 * 86400000) },
        { title: 'Termite Inspection', category: 'safety', status: 'pending', date: new Date(Date.now() - 5 * 86400000) }, // Overdue
        { title: 'Nutrition Talk: Healthy Snacks', category: 'nutrition', status: 'completed', date: new Date(Date.now() - 1 * 86400000) },
        { title: 'Dental Checkup Camp', category: 'event', status: 'pending', date: new Date(Date.now() + 2 * 86400000) },
        { title: 'Toilet Facilities Audit', category: 'hygiene', status: 'pending', date: new Date() },
        { title: 'Fire Extinguisher Check', category: 'safety', status: 'completed', date: new Date(Date.now() - 10 * 86400000) },
    ];
    
    for (const a of activitiesData) {
        await prisma.activity.create({
            data: { ...a, schoolId: school.id, assigneeId: users[2].id }
        });
    }
    console.log('✅ Activities created');

    // 7. Create Courses & Progress
    const coursesData = [
        { title: 'First Aid Basics', type: 'video', durationMinutes: 45, mandatory: true },
        { title: 'Child Protection Policy', type: 'document', durationMinutes: 30, mandatory: true },
        { title: 'Allergy Management', type: 'module', durationMinutes: 60, mandatory: true },
        { title: 'Mental Health Awareness', type: 'video', durationMinutes: 90, mandatory: true },
        { title: 'CPR Certification', type: 'presentation', durationMinutes: 120, mandatory: false },
        { title: 'Fire Safety Drill', type: 'video', durationMinutes: 20, mandatory: false },
    ];

    const courses = [];
    for (const c of coursesData) {
        const course = await prisma.course.create({ data: c });
        courses.push(course);
    }
    
    // Add progress for the Admin user
    await prisma.courseProgress.create({
        data: { userId: users[0].id, courseId: courses[0].id, status: 'completed', progressPercent: 100, minutesSpent: 45, completedAt: new Date() }
    });
    await prisma.courseProgress.create({
        data: { userId: users[0].id, courseId: courses[1].id, status: 'in_progress', progressPercent: 50, minutesSpent: 15 }
    });
    console.log('✅ Courses & Progress created');

    // 8. Upcoming Events
    await prisma.trainingEvent.createMany({
        data: [
            { schoolId: school.id, title: 'CPR Refresher Course', startsAt: new Date(Date.now() + 3 * 86400000), location: 'Staff Room A' },
            { schoolId: school.id, title: 'Annual Health & Safety Seminar', startsAt: new Date(Date.now() + 10 * 86400000), location: 'Main Auditorium' },
            { schoolId: school.id, title: 'First Aid Level 2', startsAt: new Date(Date.now() + 14 * 86400000), location: 'Online' }
        ]
    });
    console.log('✅ Training Events created');

    console.log('🎉 DATABASE SEED COMPLETE!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());