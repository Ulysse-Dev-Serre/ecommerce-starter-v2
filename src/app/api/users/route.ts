import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getAllUsers } from '@/lib/services/users';

import { userSearchSchema } from '@/lib/validators/user';

async function getUsers(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('X-Request-ID') || crypto.randomUUID();
  const { searchParams } = new URL(req.url);

  // Step 1: Validation
  // Zod coerce automatically converts strings to numbers/booleans where required
  const filters = userSearchSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    role: searchParams.get('role'),
  });

  logger.info(
    { requestId, action: 'get_all_users', filters },
    'Fetching users'
  );

  // Step 2: Service Call
  const result = await getAllUsers(filters);

  // Distinct return logic for paginated list vs old flat list
  return NextResponse.json({
    success: true,
    requestId,
    data: result.users,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}

export const GET = withError(
  withRateLimit(withAdmin(getUsers), RateLimits.STRICT)
);
