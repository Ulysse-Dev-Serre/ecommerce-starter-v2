import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: t('contact'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/contact`])
      ),
    },
    openGraph: {
      title: t('contact'),
      description: t('description'),
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('title')}</h1>

      <div className="bg-card rounded-lg shadow-sm border border-border p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ContactInfo locale={locale} />

          <div className="bg-background/50 p-6 rounded-xl border border-border/50 animate-in fade-in slide-in-from-right-4 duration-500">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
