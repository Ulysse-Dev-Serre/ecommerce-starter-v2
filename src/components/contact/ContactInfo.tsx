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
    <div className="animate-in fade-in slide-in-from-left-4 duration-700 space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          {t('title')}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t('description')}
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-start gap-5">
          <div className="mt-1 bg-primary/10 text-primary p-3 rounded-lg border border-primary/20">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {t('emailLabel')}
            </p>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              {SITE_EMAIL}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <div className="mt-1 bg-muted text-foreground p-3 rounded-lg border border-border">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
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
          className="bg-muted/50 border-border rounded-xl p-6"
        >
          <div className="text-sm font-medium text-muted-foreground leading-relaxed">
            {t.rich('refundText', {
              link: chunks => (
                <Link
                  href={`/${locale}/orders`}
                  className="font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary transition-colors"
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
