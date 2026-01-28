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
    <form className="vibe-stack-y-6" onSubmit={handleSubmit}>
      <div className="vibe-stack-y-2">
        <label htmlFor="name" className="vibe-text-xs-bold-muted-caps">
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

      <div className="vibe-stack-y-2">
        <label htmlFor="email" className="vibe-text-xs-bold-muted-caps">
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

      <div className="vibe-stack-y-2">
        <label htmlFor="message" className="vibe-text-xs-bold-muted-caps">
          {t('formMessage')}
        </label>
        <textarea
          id="message"
          rows={5}
          className="vibe-input h-auto vibe-pt-2 resize-none"
          placeholder={t('formMessagePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        className="vibe-button-primary vibe-relative-full vibe-btn-sm-h10"
        disabled={true}
      >
        {isSubmitting ? (
          <Loader2 className="vibe-icon-sm vibe-icon-spin" />
        ) : (
          t('formSubmit')
        )}
      </button>
    </form>
  );
}
