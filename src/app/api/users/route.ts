import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getAllUsers } from '@/lib/services/users';

// PROTECTED: Admin only
async function getUsers(req: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  logger.info({ requestId, action: 'get_all_users' }, 'Fetching all users');

  // Potential improvement: Add pagination support to getAllUsers()
  const users = await getAllUsers();

  // Explicitly return a Promise<NextResponse>
  return NextResponse.json({
    success: true,
    requestId,
    count: users.length,
    users,
    timestamp: new Date().toISOString(),
  });
}

export const GET = withError(
  withRateLimit(withAdmin(getUsers), RateLimits.STRICT)
);
