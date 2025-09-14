import { NextResponse } from 'next/server'
import { getAllUsers } from '../../../lib/services/user.service'
import { withError } from '../../../lib/middleware/withError'
import { logger } from '../../../lib/logger'

async function getUsers() {
  logger.info({ action: 'get_all_users' }, 'Fetching all users')
  
  const users = await getAllUsers()
  
  logger.info({ 
    action: 'users_fetched_successfully',
    count: users.length 
  }, `Retrieved ${users.length} users`)
  
  return NextResponse.json({ 
    success: true,
    count: users.length,
    users,
    timestamp: new Date().toISOString(),
  })
}

export const GET = withError(getUsers)