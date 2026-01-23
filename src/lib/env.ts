import { z } from 'zod';

// Schéma pour les variables côté serveur (non exposées au client)
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Clerk (Auth)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  CLERK_TEST_USER_ID: z.string().optional(),

  // Stripe (Paiements)
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_AUTOMATIC_TAX: z.string().transform(val => val === 'true'),

  // Resend (Emails)
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_LOCALE: z.string().default('fr'),

  // Shippo (Livraison)
  SHIPPO_API_KEY: z.string().min(1),
  SHIPPO_UPS_ACCOUNT_ID: z.string().optional(),
  SHIPPO_FROM_PHONE: z.string().optional(),
  SHIPPO_WEBHOOK_SECRET: z.string().optional(),

  // External Services
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

// Schéma pour les variables côté client (exposées via NEXT_PUBLIC_)
const clientSchema = z.object({
  // Site Config
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_CORS_ORIGIN: z.string().url(),

  // Clerk Public
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Stripe Public
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // Google & Analytics
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),

  // i18n & Currency
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
  NEXT_PUBLIC_LOCALES: z.string().default('fr,en'),
  NEXT_PUBLIC_CURRENCY: z.string().default('CAD'),
});

// Fusion des schémas pour inférence de type
// Note: On sépare la validation client/serveur pour éviter les erreurs lors du build frontend
const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CORS_ORIGIN: process.env.NEXT_PUBLIC_CORS_ORIGIN,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_LOCALES: process.env.NEXT_PUBLIC_LOCALES,
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
});

const _serverEnv = serverSchema.safeParse(process.env);

// En production, on veut bloquer le build si une variable manque.
// En dev, on log juste une erreur pour ne pas bloquer si on travaille sur autre chose.
if (!_clientEnv.success) {
  console.error(
    '❌ Invalid CLIENT environment variables:',
    _clientEnv.error.format()
  );
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid CLIENT environment variables');
  }
}

// On ne valide le serveur que si on est côté serveur (runtime check)
const isServer = typeof window === 'undefined';
if (isServer && !_serverEnv.success) {
  console.error(
    '❌ Invalid SERVER environment variables:',
    _serverEnv.error.format()
  );
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid SERVER environment variables');
  }
}

// Helper pour exporter les variables propres
export const env = {
  // Variables Serveur (Uniquement dispos côté serveur)
  DATABASE_URL: process.env.DATABASE_URL!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET!,
  CLERK_TEST_USER_ID: process.env.CLERK_TEST_USER_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_AUTOMATIC_TAX: process.env.STRIPE_AUTOMATIC_TAX === 'true',
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  FROM_EMAIL: process.env.FROM_EMAIL!,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  ADMIN_LOCALE: process.env.ADMIN_LOCALE || 'fr',
  SHIPPO_API_KEY: process.env.SHIPPO_API_KEY!,
  SHIPPO_UPS_ACCOUNT_ID: process.env.SHIPPO_UPS_ACCOUNT_ID,
  SHIPPO_FROM_PHONE: process.env.SHIPPO_FROM_PHONE,
  SHIPPO_WEBHOOK_SECRET: process.env.SHIPPO_WEBHOOK_SECRET,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL,

  // Variables Client (Dispos partout)
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME!,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
  NEXT_PUBLIC_CORS_ORIGIN: process.env.NEXT_PUBLIC_CORS_ORIGIN!,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  NEXT_PUBLIC_LOCALES: (process.env.NEXT_PUBLIC_LOCALES || 'fr,en').split(','),
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || 'CAD',
} as const;
