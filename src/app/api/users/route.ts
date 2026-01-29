import { NextResponse } from 'next/server';

import { logger } from '../../../lib/core/logger';
import { withAdmin } from '../../../lib/middleware/withAuth';
import { withError } from '../../../lib/middleware/withError';
import { getAllUsers } from '../../../lib/services/users';

// PROTECTED: Admin only
async function getUsers(): Promise<NextResponse> {
  logger.info({ action: 'get_all_users' }, 'Fetching all users');

  const users = await getAllUsers();

  logger.info(
    {
      action: 'users_fetched_successfully',
      count: users.length,
    },
    `Retrieved ${users.length} users`
  );

  return NextResponse.json({
    success: true,
    count: users.length,
    users,
    timestamp: new Date().toISOString(),
  });
}

// NOTE: Actual Profile Updates are usually done via Clerk Webhooks or specific user endpoints.
// If this route is intended for Admin updates of users, we'd implement a POST/PUT here.
// Currently the user request specified 'api/users/route.ts' (POST/PUT - Profile updates) in the plan.
// But the current file ONLY has GET.
// I will assume for now we just want to SECURE the GET if it was mutable, but it is GET.
// Wait, the plan said "POST/PUT - Profile updates". I should probably add the capability or skip if not present.
// Looking at the code, it seems `api/users` is currently read-only for admins.
// There is no POST/PUT to secure yet.
// I will respect the plan but if code doesn't exist, I cannot "secure" it. I can only create it if that was the intent.
// Given the context is "Securing", I should not add *new features* unless implicitly required.
// I will skip adding POST/PUT if it doesn't exist, to avoid scope creep.
// I will just leave GET as is (secured by withAdmin).

export const GET = withError(withAdmin(getUsers));
