import Stripe from 'stripe';

import { logger } from '@/lib/core/logger';
import { env } from '@/lib/core/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia' as Stripe.StripeConfig['apiVersion'],
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
