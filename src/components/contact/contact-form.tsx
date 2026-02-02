'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { submitContactMessage } from '@/lib/client/contact';

export function ContactForm() {
  const t = useTranslations('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        message: formData.get('message') as string,
      };

      await submitContactMessage(data);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert(t('errorSending'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="duration-500 vibe-flex-col-center text-center vibe-py-12">
        <div className="vibe-icon-box-success mb-6 duration-500">
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
        <h3 className="text-xl font-bold text-foreground vibe-mb-2">
          {t('successTitle')}
        </h3>
        <p className="text-muted-foreground">{t('successMessage')}</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="vibe-button-secondary mt-8 h-10 px-6"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="vibe-stack-y-2">
        <label
          htmlFor="name"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t('formName')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="vibe-input"
          placeholder={t('formNamePlaceholder')}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="vibe-stack-y-2">
        <label
          htmlFor="email"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t('formEmail')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="vibe-input"
          placeholder={t('formEmailPlaceholder')}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="vibe-stack-y-2">
        <label
          htmlFor="message"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t('formMessage')}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="vibe-input h-auto pt-2 resize-none"
          placeholder={t('formMessagePlaceholder')}
          disabled={isSubmitting}
          required
        />
      </div>

      <button
        type="submit"
        className="vibe-button-primary w-full h-12"
        disabled={isSubmitting}
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
