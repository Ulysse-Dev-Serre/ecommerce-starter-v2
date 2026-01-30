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
  // TODO: Switch to false when /api/contact is implemented
  const SIMULATE = true;

  // En attendant que l'API soit créée, on simule un succès
  // Cela permet de centraliser la logique même pour les simulations
  if (SIMULATE) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true };
  }

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
