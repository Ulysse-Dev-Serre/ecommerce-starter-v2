import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');

  // 1. Récupérer les produits actifs
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  });

  // 2. Définir les routes statiques de base
  const staticRoutes = ['', '/shop', '/contact'];
  const locales = ['fr', 'en'];

  // 3. Générer les entrées pour les routes statiques (multilingue)
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(route =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          fr: `${baseUrl}/fr${route}`,
          en: `${baseUrl}/en${route}`,
        },
      },
    }))
  );

  // 4. Générer les entrées pour les produits (multilingue)
  const productEntries: MetadataRoute.Sitemap = products.flatMap(product =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9, // Les produits sont importants
      alternates: {
        languages: {
          fr: `${baseUrl}/fr/product/${product.slug}`,
          en: `${baseUrl}/en/product/${product.slug}`,
        },
      },
    }))
  );

  return [...staticEntries, ...productEntries];
}
