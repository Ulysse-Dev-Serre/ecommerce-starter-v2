import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

// Headers de sécurité HTTP
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: process.env.NEXT_PUBLIC_CORS_ORIGIN ?? '*',
  },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://*.googleapis.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://va.vercel-scripts.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https://*.stripe.com https://maps.gstatic.com https://*.googleapis.com https://img.clerk.com https://images.clerk.dev https://res.cloudinary.com https://github.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://vitals.vercel-insights.com https://api.shippo.com; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com; " +
      "object-src 'none'; " +
      "base-uri 'self';",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Exemple de redirection manuelle pour un changement de slug (Migration V1 -> V2) :
      // {
      //   source: '/ancien-nom-produit',
      //   destination: '/fr/produits/nouveau-nom-produit',
      //   permanent: true,
      // },
    ];
  },
};

export default withNextIntl(nextConfig);
