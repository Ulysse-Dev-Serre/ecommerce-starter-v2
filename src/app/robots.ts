import { MetadataRoute } from 'next';

import { env } from '@/lib/core/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/_next/',
        '/private/',
        '/checkout/',
        '/cart/',
        '/orders/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
