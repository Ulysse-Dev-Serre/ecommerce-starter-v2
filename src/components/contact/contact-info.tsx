import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { SITE_EMAIL, SITE_ADDRESS } from '@/lib/config/site';
import { Alert } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

interface ContactInfoProps {
  locale: string;
}

export function ContactInfo({ locale }: ContactInfoProps) {
  const t = useTranslations('contact');

  return (
    <div className="duration-700 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">
          {t('title')}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t('description')}
        </p>
      </div>

      <div className="space-y-8">
        <div className="vibe-flex-items-start-gap-5">
          <div className="bg-primary/10 text-primary p-3 rounded-lg border border-primary/20 mt-1">
            <Mail className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground vibe-mb-1">
              {t('emailLabel')}
            </p>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="text-xl font-bold text-foreground hover:text-primary transition-all duration-300"
            >
              {SITE_EMAIL}
            </a>
          </div>
        </div>

        <div className="vibe-flex-items-start-gap-5">
          <div className="bg-muted text-foreground p-3 rounded-lg border border-border mt-1">
            <MapPin className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground vibe-mb-1">
              {t('addressLabel')}
            </p>
            <p className="text-xl font-bold text-foreground whitespace-pre-line leading-snug">
              {SITE_ADDRESS}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Alert
          variant="info"
          title={t('refundTitle')}
          className="bg-muted/30 vibe-border-border vibe-card-rounded-xl vibe-p-6"
        >
          <div className="vibe-text-xs font-medium text-muted-foreground leading-relaxed">
            {t.rich('refundText', {
              link: chunks => (
                <Link
                  href={`/${locale}/orders`}
                  className="font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary transition-all duration-300"
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
