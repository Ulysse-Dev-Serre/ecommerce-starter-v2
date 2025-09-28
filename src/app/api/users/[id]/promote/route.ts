import { NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { withError } from '../../../../../lib/middleware/withError';
import {
  getUserById,
  promoteUser,
} from '../../../../../lib/services/user.service';

// POST - Promouvoir/Rétrograder un utilisateur (CLIENT ↔ ADMIN)
async function promoteUserHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  logger.info(
    { action: 'promote_user', userId: id },
    `Processing role change for user ${id}`
  );

  // Vérifier si l'utilisateur existe
  const user = await getUserById(id);
  if (!user) {
    logger.warn(
      { action: 'promote_user_not_found', userId: id },
      `User ${id} not found`
    );
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Déterminer le nouveau rôle
  const newRole = user.role === 'ADMIN' ? 'CLIENT' : 'ADMIN';
  const action = user.role === 'ADMIN' ? 'demoted' : 'promoted';

  logger.info(
    {
      action: 'role_change_determined',
      userId: id,
      currentRole: user.role,
      newRole,
      actionType: action,
    },
    `User will be ${action} from ${user.role} to ${newRole}`
  );

  // Effectuer le changement
  const updatedUser = await promoteUser(id, newRole);

  logger.info(
    {
      action: 'user_role_changed_successfully',
      userId: id,
      previousRole: user.role,
      newRole: updatedUser.role,
      userEmail: updatedUser.email,
    },
    `User ${action} successfully: ${updatedUser.email} is now ${updatedUser.role}`
  );

  return NextResponse.json({
    success: true,
    user: updatedUser,
    message: `User ${action} to ${newRole} successfully`,
    previousRole: user.role,
    newRole: updatedUser.role,
    timestamp: new Date().toISOString(),
  });
}

export const POST = withError(promoteUserHandler);
