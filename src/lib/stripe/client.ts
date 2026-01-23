import Stripe from 'stripe';

import { logger } from '../logger';
import { env } from '../env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
  appInfo: {
    name: 'ecommerce-starter-v2',
    version: '0.1.0',
  },
});

logger.info(
  {
    mode: env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 'live',
  },
  'Stripe client initialized'
);
