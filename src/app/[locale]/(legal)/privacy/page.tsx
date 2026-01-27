import { getTranslations } from 'next-intl/server';
import React from 'react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  const lastUpdated = t('lastUpdated', {
    date: new Date().toLocaleDateString(locale),
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('privacyPolicy.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{lastUpdated}</p>
      </div>

      <div className="prose prose-stone dark:prose-invert max-w-none">
        <p className="whitespace-pre-line text-lg leading-relaxed">
          {t('privacyPolicy.content')}
        </p>
      </div>
    </div>
  );
}
