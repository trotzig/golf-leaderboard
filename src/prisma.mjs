import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

const prisma = global.__prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma

export default prisma;
