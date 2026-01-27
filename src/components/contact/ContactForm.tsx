'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function ContactForm() {
  const t = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
        >
          {t('formName')}
        </label>
        <input
          type="text"
          id="name"
          className="vibe-input"
          placeholder={t('formNamePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
        >
          {t('formEmail')}
        </label>
        <input
          type="email"
          id="email"
          className="vibe-input"
          placeholder={t('formEmailPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
        >
          {t('formMessage')}
        </label>
        <textarea
          id="message"
          rows={5}
          className="vibe-input h-auto py-3 resize-none"
          placeholder={t('formMessagePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        className="vibe-button-primary w-full h-12"
        disabled={true}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          t('formSubmit')
        )}
      </button>
    </form>
  );
}
