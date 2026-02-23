/**
 * Centralized Contact Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/**
 * Submit a contact form message
 */
export async function submitContactMessage(payload: ContactMessageInput) {
  const response = await fetch(API_ROUTES.CONTACT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return await response.json();
}
