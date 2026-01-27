import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { SITE_EMAIL, SITE_ADDRESS } from '@/lib/constants';
import { ContactForm } from '@/components/contact/ContactForm';
import { Alert } from '@/components/ui/alert';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: t('contact'),
    description: t('description'),
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
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
            <p className="text-muted-foreground mb-6">{t('description')}</p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t('emailLabel')}
                  </p>
                  <a
                    href={`mailto:${SITE_EMAIL}`}
                    className="text-primary hover:underline transition-colors"
                  >
                    {SITE_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t('addressLabel')}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {SITE_ADDRESS}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Alert variant="info" title={t('refundTitle')}>
                {t.rich('refundText', {
                  link: chunks => (
                    <Link
                      href={`/${locale}/orders`}
                      className="font-bold underline hover:opacity-80 transition-opacity"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </Alert>
            </div>
          </div>

          <div className="bg-background/50 p-6 rounded-xl border border-border/50">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
