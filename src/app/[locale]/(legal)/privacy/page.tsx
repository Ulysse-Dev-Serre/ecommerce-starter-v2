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

        {/* Placeholder real content structure for visual validation */}
        <div className="mt-8 space-y-4 text-muted-foreground text-sm">
          <p className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-900">
            <strong>Note:</strong> This page is using translations from{' '}
            <code>{locale}.json</code>. To edit this content, update the
            &quot;legal.privacyPolicy.content&quot; key in the translation file,
            or replace this component&apos;s logic to load from a Markdown file
            or CMS.
          </p>
        </div>
      </div>
    </div>
  );
}
