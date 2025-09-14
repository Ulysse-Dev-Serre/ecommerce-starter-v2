import { WebhookEvent } from '@clerk/nextjs/server'
import { UserRole } from '../../generated/prisma'
import { logger } from '../logger'
import { createUserFromClerk, upsertUserFromClerk, deleteUserByClerkId } from './user.service'

/**
 * Process Clerk user.created webhook event
 */
export async function handleUserCreated(eventData: any) {
  logger.info({
    action: 'webhook_user_created',
    userId: eventData.id,
    email: eventData.email_addresses?.[0]?.email_address,
  }, 'Processing user.created webhook')

  // Validation
  if (!eventData.id) {
    throw new Error('User ID is required')
  }

  const primaryEmail = eventData.email_addresses?.find(
    (email: any) => email.id === eventData.primary_email_address_id
  )

  if (!primaryEmail) {
    throw new Error('Primary email not found')
  }

  // Determine role based on email or metadata
  let role = UserRole.CLIENT
  if (primaryEmail.email_address.includes('admin')) {
    role = UserRole.ADMIN
  }

  // Get role from metadata if available
  const metadataRole = eventData.public_metadata?.role
  if (metadataRole && ['CLIENT', 'ADMIN'].includes(metadataRole)) {
    role = metadataRole as UserRole
  }

  return createUserFromClerk({
    clerkId: eventData.id,
    email: primaryEmail.email_address,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  })
}

/**
 * Process Clerk user.updated webhook event
 */
export async function handleUserUpdated(eventData: any) {
  logger.info({
    action: 'webhook_user_updated',
    userId: eventData.id,
  }, 'Processing user.updated webhook')

  if (!eventData.id) {
    throw new Error('User ID is required')
  }

  const primaryEmail = eventData.email_addresses?.find(
    (email: any) => email.id === eventData.primary_email_address_id
  )

  if (!primaryEmail) {
    throw new Error('Primary email not found')
  }

  // Determine role
  let role = UserRole.CLIENT
  const metadataRole = eventData.public_metadata?.role
  if (metadataRole && ['CLIENT', 'ADMIN'].includes(metadataRole)) {
    role = metadataRole as UserRole
  }

  return upsertUserFromClerk(eventData.id, {
    email: primaryEmail.email_address,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  })
}

/**
 * Process Clerk user.deleted webhook event
 */
export async function handleUserDeleted(eventData: any) {
  logger.info({
    action: 'webhook_user_deleted',
    userId: eventData.id,
  }, 'Processing user.deleted webhook')

  if (!eventData.id) {
    throw new Error('User ID is required')
  }

  return deleteUserByClerkId(eventData.id)
}

/**
 * Process webhook event based on type
 */
export async function processWebhookEvent(eventType: string, eventData: any) {
  switch (eventType) {
    case 'user.created':
      return handleUserCreated(eventData)
    
    case 'user.updated':
      return handleUserUpdated(eventData)
    
    case 'user.deleted':
      return handleUserDeleted(eventData)
    
    default:
      logger.warn({
        action: 'webhook_unhandled',
        eventType,
      }, `Unhandled webhook event type: ${eventType}`)
      return null
  }
}
