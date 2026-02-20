import { MetadataRoute } from 'next';

import { SUPPORTED_LOCALES } from '@/lib/config/site';
import { prisma } from '@/lib/core/db';
import { env } from '@/lib/core/env';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  // 1. Récupérer les produits actifs
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  // 2. Définir les routes statiques
  const staticRoutes = ['', '/shop', '/contact'];
  const locales = [...SUPPORTED_LOCALES];

  // Helper pour générer les alternates hreflang
  const getAlternates = (route: string) => {
    return Object.fromEntries(
      locales.map(locale => [locale, `${baseUrl}/${locale}${route}`])
    );
  };

  // 3. Routes statiques (Multilingue)
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(route =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: getAlternates(route),
      },
    }))
  );

  // 4. Routes produits (Multilingue)
  const productEntries: MetadataRoute.Sitemap = products.flatMap(product => {
    const route = `/product/${product.slug}`;
    const alternates = getAlternates(route);

    return locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: alternates,
      },
    }));
  });

  return [...staticEntries, ...productEntries];
}
