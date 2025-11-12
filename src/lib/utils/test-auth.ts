/**
 * Test authentication utilities
 * Provides helper functions for test bypass authentication
 */

import { NextRequest } from 'next/server';

import { prisma } from '../db/prisma';

export interface TestAuthResult {
  userId?: string;
  isTestMode: boolean;
}

/**
 * Check if request is in test mode and get test user
 */
export async function getTestAuth(
  request: NextRequest
): Promise<TestAuthResult> {
  const testApiKey = request.headers.get('x-test-api-key');

  if (
    testApiKey &&
    process.env.TEST_API_KEY &&
    testApiKey === process.env.TEST_API_KEY &&
    process.env.NODE_ENV !== 'production'
  ) {
    const clerkTestUserId =
      process.env.CLERK_TEST_USER_ID || 'user_35FXh55upbdX9L0zj1bjnrFCAde';
    const testUser = await prisma.user.findUnique({
      where: { clerkId: clerkTestUserId },
      select: { id: true },
    });

    return {
      userId: testUser?.id,
      isTestMode: true,
    };
  }

  return {
    isTestMode: false,
  };
}
