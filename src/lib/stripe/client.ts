import Stripe from 'stripe';

import { logger } from '../logger';

// Initialize Stripe lazily or with a dummy key during build if needed
// This prevents build errors in CI where secrets might not be available during static generation
const stripeKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build';

if (!process.env.STRIPE_SECRET_KEY) {
  // We only log a warning here instead of throwing, to allow build to proceed
  // The API routes using this will fail at runtime if the key is missing, which is expected
  console.warn('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
  appInfo: {
    name: 'ecommerce-starter-v2',
    version: '0.1.0',
  },
});

logger.info(
  {
    mode: stripeKey.startsWith('sk_test_') ? 'test' : 'live',
  },
  'Stripe client initialized'
);
