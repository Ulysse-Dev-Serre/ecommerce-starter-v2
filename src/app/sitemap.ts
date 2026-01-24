import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { i18n } from '@/lib/i18n/config';

import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  // 1. Récupérer les produits actifs
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  });

  // 2. Définir les routes statiques de base
  const staticRoutes = ['', '/shop', '/contact'];
  const locales = i18n.locales;

  // Helper to generate alternates
  const getAlternates = (route: string) => {
    return locales.reduce(
      (acc, locale) => {
        acc[locale] = `${baseUrl}/${locale}${route}`;
        return acc;
      },
      {} as Record<string, string>
    );
  };

  // 3. Générer les entrées pour les routes statiques (multilingue)
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(route =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: getAlternates(route),
      },
    }))
  );

  // 4. Générer les entrées pour les produits (multilingue)
  const productEntries: MetadataRoute.Sitemap = products.flatMap(product => {
    const route = `/product/${product.slug}`;
    const alternates = getAlternates(route);

    return locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: alternates,
      },
    }));
  });

  return [...staticEntries, ...productEntries];
}
