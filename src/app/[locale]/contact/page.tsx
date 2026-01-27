import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

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

      <div className="bg-card rounded-lg shadow-sm border p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
            <p className="text-gray-600 mb-6">{t('description')}</p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('emailLabel')}</p>
                  <a
                    href="mailto:support@agtechnest.com"
                    className="text-primary hover:underline"
                  >
                    support@agtechnest.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('addressLabel')}</p>
                  <p className="text-gray-600">
                    Montreal, QC
                    <br />
                    Canada
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                {t('refundTitle')}
              </h3>
              <p className="text-sm text-yellow-800">
                {t.rich('refundText', {
                  link: chunks => (
                    <Link
                      href={`/${locale}/orders`}
                      className="font-bold underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('formName')}
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('formNamePlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('formEmail')}
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('formEmailPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('formMessage')}
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('formMessagePlaceholder')}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover transition-colors"
              disabled
            >
              {t('formSubmit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
