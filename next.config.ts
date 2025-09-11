// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Gère l'origine pour le développement et la production
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_CORS_ORIGIN || '*',
          },
          // Force le HTTPS, essentiel pour la production
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Empêche le site d'être embarqué dans une iframe
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Empêche les attaques de type MIME-sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Contrôle quelles informations de la page précédente sont envoyées
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
