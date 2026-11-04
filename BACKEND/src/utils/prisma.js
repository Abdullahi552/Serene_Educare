import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Create the PostgreSQL adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// 2. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });

export default prisma;