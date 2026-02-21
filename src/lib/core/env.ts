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
  SHIPPO_WEBHOOK_SECRET: z.string().optional().or(z.string().min(1).optional()), // Supports both naming conventions
  SHIPPO_EXPORT_B13A_OPTION: z.string().optional(),
  SHIPPO_EXPORT_B13A_NUMBER: z.string().optional(),
  SHIPPO_FROM_NAME: z.string().optional(),
  SHIPPO_FROM_COMPANY: z.string().optional(),
  SHIPPO_FROM_STREET1: z.string().optional(),
  SHIPPO_FROM_CITY: z.string().optional(),
  SHIPPO_FROM_STATE: z.string().optional(),
  SHIPPO_FROM_ZIP: z.string().optional(),
  SHIPPO_FROM_COUNTRY: z.string().optional(),
  SHIPPO_FROM_EMAIL: z.string().optional(),

  // External Services
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Storage (Local & S3)
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  STORAGE_LOCAL_UPLOAD_DIR: z.string().default('public/uploads'),
  STORAGE_LOCAL_PUBLIC_PATH: z.string().default('/uploads'),
  // S3 (Optionnel)
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  // Cloudinary (Optionnel)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  TEST_API_KEY: z.string().optional(),
});

// Schéma pour les variables côté client (exposées via NEXT_PUBLIC_)
const clientSchema = z.object({
  // Instance Identity (URLs change between environments)
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_CORS_ORIGIN: z.string().url(),

  // Clerk Public
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Stripe Public
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // Google & Analytics
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

// Validation
const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CORS_ORIGIN: process.env.NEXT_PUBLIC_CORS_ORIGIN,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
});

const _serverEnv = serverSchema.safeParse(process.env);

// En production, on veut bloquer le build si une variable manque.
if (!_clientEnv.success) {
  console.error(
    '❌ Invalid CLIENT environment variables:',
    _clientEnv.error.format()
  );
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid CLIENT environment variables');
  }
}

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
  // Variables Serveur
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
  SHIPPO_WEBHOOK_SECRET:
    process.env.SHIPPO_WEBHOOK_SECRET || process.env.SHIPPO_WEBHOOK_TOKEN,
  SHIPPO_EXPORT_B13A_OPTION: process.env.SHIPPO_EXPORT_B13A_OPTION,
  SHIPPO_EXPORT_B13A_NUMBER: process.env.SHIPPO_EXPORT_B13A_NUMBER,
  SHIPPO_FROM_NAME: process.env.SHIPPO_FROM_NAME,
  SHIPPO_FROM_COMPANY: process.env.SHIPPO_FROM_COMPANY,
  SHIPPO_FROM_STREET1: process.env.SHIPPO_FROM_STREET1,
  SHIPPO_FROM_CITY: process.env.SHIPPO_FROM_CITY,
  SHIPPO_FROM_STATE: process.env.SHIPPO_FROM_STATE,
  SHIPPO_FROM_ZIP: process.env.SHIPPO_FROM_ZIP,
  SHIPPO_FROM_COUNTRY: process.env.SHIPPO_FROM_COUNTRY,
  SHIPPO_FROM_EMAIL: process.env.SHIPPO_FROM_EMAIL,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL,
  TEST_API_KEY: process.env.TEST_API_KEY,

  // Storage
  STORAGE_PROVIDER:
    (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'cloudinary') || 'local',
  STORAGE_LOCAL_UPLOAD_DIR:
    process.env.STORAGE_LOCAL_UPLOAD_DIR || 'public/uploads',
  STORAGE_LOCAL_PUBLIC_PATH:
    process.env.STORAGE_LOCAL_PUBLIC_PATH || '/uploads',
  STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
  STORAGE_S3_REGION: process.env.STORAGE_S3_REGION,
  STORAGE_S3_ACCESS_KEY_ID: process.env.STORAGE_S3_ACCESS_KEY_ID,
  STORAGE_S3_SECRET_ACCESS_KEY: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
  STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Variables Client
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
  NEXT_PUBLIC_CORS_ORIGIN: process.env.NEXT_PUBLIC_CORS_ORIGIN!,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
} as const;
