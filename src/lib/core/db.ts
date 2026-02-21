import { env } from '@/lib/core/env';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient as Client } from '../../generated/prisma/client';

import type { PrismaClient } from '../../generated/prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new Client({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
