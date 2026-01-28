import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { SITE_EMAIL, SITE_ADDRESS } from '@/lib/constants';
import { Alert } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

interface ContactInfoProps {
  locale: string;
}

export function ContactInfo({ locale }: ContactInfoProps) {
  const t = useTranslations('common');

  return (
    <div className="vibe-animate-slide-in-left vibe-stack-y-10">
      <div>
        <h2 className="vibe-text-price-xl vibe-mb-4 vibe-tracking-tight">
          {t('title')}
        </h2>
        <p className="vibe-text-p-lg">{t('description')}</p>
      </div>

      <div className="vibe-stack-y-8">
        <div className="vibe-flex-items-start-gap-5">
          <div className="vibe-icon-box-primary vibe-mt-1">
            <Mail className="vibe-icon-md" />
          </div>
          <div>
            <p className="vibe-text-xs-bold-muted-caps vibe-mb-1">
              {t('emailLabel')}
            </p>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="vibe-text-xl-bold hover:vibe-text-primary vibe-transition"
            >
              {SITE_EMAIL}
            </a>
          </div>
        </div>

        <div className="vibe-flex-items-start-gap-5">
          <div className="vibe-icon-box-muted vibe-mt-1">
            <MapPin className="vibe-icon-md" />
          </div>
          <div>
            <p className="vibe-text-xs-bold-muted-caps vibe-mb-1">
              {t('addressLabel')}
            </p>
            <p className="vibe-text-xl-bold whitespace-pre-line vibe-leading-snug">
              {SITE_ADDRESS}
            </p>
          </div>
        </div>
      </div>

      <div className="vibe-pt-6">
        <Alert
          variant="info"
          title={t('refundTitle')}
          className="vibe-bg-muted-soft vibe-border-border vibe-card-rounded-xl vibe-p-6"
        >
          <div className="vibe-text-xs vibe-text-medium vibe-text-muted vibe-leading-relaxed">
            {t.rich('refundText', {
              link: chunks => (
                <Link
                  href={`/${locale}/orders`}
                  className="vibe-text-bold vibe-text-foreground vibe-underline-primary vibe-hover-primary vibe-transition"
                >
                  {chunks}
                </Link>
              ),
            })}
          </div>
        </Alert>
      </div>
    </div>
  );
}
