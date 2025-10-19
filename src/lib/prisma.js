import { PrismaClient } from '@prisma/client';

// Mencegah multiple instance PrismaClient di mode development
// karena adanya "hot reload" dari Next.js

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}