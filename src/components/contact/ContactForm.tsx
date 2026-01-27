'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * ContactForm component handles the UI and submission logic for the contact form.
 * Currently disabled by default as per existing implementation.
 */
export function ContactForm() {
  const t = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for form submission would go here
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          {t('formName')}
        </label>
        <input
          type="text"
          id="name"
          className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          placeholder={t('formNamePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          {t('formEmail')}
        </label>
        <input
          type="email"
          id="email"
          className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          placeholder={t('formEmailPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          {t('formMessage')}
        </label>
        <textarea
          id="message"
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          placeholder={t('formMessagePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={true} // Kept disabled as in original code
      >
        {t('formSubmit')}
      </button>
    </form>
  );
}
