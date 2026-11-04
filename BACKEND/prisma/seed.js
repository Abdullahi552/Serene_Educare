import bcrypt from 'bcryptjs';
import prisma from '../src/utils/prisma.js';

async function main() {
    const passwordHash = await bcrypt.hash('password123', 12);

    const school = await prisma.school.create({
        data: {
            name: 'Nectar Schools',
            schoolCode: 'DST-8842',
        }
    });

    await prisma.user.create({
        data: {
            schoolId: school.id,
            name: 'Busola Alao',
            email: 'admin1@nectarschools.com',
            passwordHash,
            role: 'school_admin',
            title: 'School Health Manager'
        }
    });

    console.log('✅ Seed successful. Admin created.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());