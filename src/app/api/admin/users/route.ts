import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/core/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getAllUsersAdmin } from '@/lib/services/users/user-admin.service';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/admin/users
 * Récupère la liste des utilisateurs (Admin seulement)
 */
async function getUsersHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('q') || undefined;
  const role = searchParams.get('role') as UserRole | undefined;

  try {
    const result = await getAllUsersAdmin({
      page,
      limit,
      search,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: result.users,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to fetch users'
    );
    throw error;
  }
}

export const GET = withError(
  withAdmin(withRateLimit(getUsersHandler, RateLimits.ADMIN))
);
