import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma;
