import React from 'react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RefundPage({ params }: PageProps) {
  const { locale } = await params;
  const dictionary = (await import(`@/lib/i18n/dictionaries/${locale}.json`))
    .default;

  const t = dictionary.legal.refundPolicy;
  const lastUpdated = dictionary.legal.lastUpdated.replace(
    '{date}',
    new Date().toLocaleDateString(locale)
  );

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{lastUpdated}</p>
      </div>

      <div className="prose prose-stone dark:prose-invert max-w-none">
        <p className="whitespace-pre-line text-lg leading-relaxed">
          {t.content}
        </p>
      </div>
    </div>
  );
}
