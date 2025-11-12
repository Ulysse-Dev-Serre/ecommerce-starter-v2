import Stripe from 'stripe';

import { logger } from '../logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
  appInfo: {
    name: 'ecommerce-starter-v2',
    version: '0.1.0',
  },
});

logger.info(
  {
    mode: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
      ? 'test'
      : 'live',
  },
  'Stripe client initialized'
);
