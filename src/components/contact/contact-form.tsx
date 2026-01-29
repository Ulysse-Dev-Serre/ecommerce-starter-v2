'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function ContactForm() {
  const t = useTranslations('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="vibe-animate-fade-in vibe-flex-col-center vibe-text-center vibe-py-12">
        <div className="vibe-icon-box-success vibe-mb-6 vibe-animate-zoom-in">
          <svg
            className="vibe-w-8 vibe-h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="vibe-text-xl-bold vibe-mb-2">{t('successTitle')}</h3>
        <p className="vibe-text-muted">{t('successMessage')}</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="vibe-button-secondary vibe-mt-8 vibe-btn-sm-h10"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

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
          required
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
          required
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
          required
        />
      </div>

      <button
        type="submit"
        className="vibe-button-primary vibe-btn-full-lg"
        disabled={isSubmitting}
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
