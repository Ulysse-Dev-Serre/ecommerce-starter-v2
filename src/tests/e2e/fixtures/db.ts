/**
 * Prisma client for E2E tests (CJS-compatible).
 *
 * The Prisma 7 `prisma-client` generator produces ESM-only code
 * (uses `import.meta.url`), which crashes in Playwright's CJS context.
 *
 * This file uses the `prisma-client-js` generated client (CJS) combined
 * with a `@prisma/adapter-pg` adapter, mirroring the app's `db.ts`
 * setup but without importing any ESM code.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Ensure env vars are loaded (Playwright doesn't always load .env)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
