'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast-provider';
import { Camera, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

import { API_ROUTES } from '@/lib/config/api-routes';

interface RefundRequestFormProps {
  orderId: string;
  orderNumber: string;
  locale: string;
  status: string;
  hasLabel: boolean;
}

export function RefundRequestForm({
  orderId,
  orderNumber,
  locale,
  status,
  hasLabel,
}: RefundRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();
  const t = useTranslations('orders.refund');

  const handleCancelOrder = async () => {
    if (!confirm(t('confirmCancel'))) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(API_ROUTES.ORDERS.REFUND_REQUEST, {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('orderId', orderId);
          fd.append('reason', t('cancelOrder'));
          fd.append('type', 'CANCELLATION');
          return fd;
        })(),
      });

      if (response.ok) {
        setIsSubmitted(true);
        showToast(t('successTitle'), 'success');
        window.location.reload();
      } else {
        showToast(t('error'), 'error');
      }
    } catch (err) {
      showToast(t('error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('reason', reason);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch(API_ROUTES.ORDERS.REFUND_REQUEST, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setIsSubmitted(true);
        showToast(t('successTitle'), 'success');
        window.location.reload();
      } else {
        showToast(t('error'), 'error');
      }
    } catch (err) {
      showToast(t('error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCancelNow = status === 'PAID';
  const isShipmentInProgress = status === 'SHIPPED' || status === 'IN_TRANSIT';
  const isDelivered = status === 'DELIVERED';

  if (isSubmitted) {
    return (
      <div className="vibe-status-banner-success-soft vibe-p-6 vibe-text-center">
        <div className="vibe-flex-center vibe-mb-4">
          <CheckCircle2 className="vibe-w-12 vibe-h-12 vibe-text-success" />
        </div>
        <h3 className="vibe-text-lg-bold vibe-text-success vibe-mb-2">
          {t('successTitle')}
        </h3>
        <p className="vibe-text-medium vibe-text-muted vibe-text-sm">
          {t('successMessage')}
        </p>
      </div>
    );
  }

  if (!isOpen) {
    const showButton = canCancelNow || isShipmentInProgress || isDelivered;
    if (!showButton) return null;

    return (
      <button
        onClick={() => setIsOpen(true)}
        className="vibe-w-full vibe-flex-center-gap-2 vibe-px-6 vibe-py-4 vibe-bg-transparent vibe-border-dashed vibe-card-rounded vibe-text-muted hover:vibe-border-primary-soft hover:vibe-text-primary vibe-transition-all group"
      >
        <AlertCircle className="vibe-w-5 vibe-h-5 group-hover:vibe-scale-110 vibe-transition-transform" />
        <span className="vibe-text-xs-bold-caps">
          {canCancelNow ? t('cancelDelivery') : t('openButton')}
        </span>
      </button>
    );
  }

  if (isShipmentInProgress) {
    return (
      <div className="vibe-status-banner-error-soft vibe-p-6 vibe-flex-col-gap-4">
        <div className="vibe-flex-gap-4 vibe-items-start">
          <div className="vibe-p-2 vibe-bg-error-soft vibe-rounded-full">
            <AlertCircle className="vibe-w-6 vibe-h-6 vibe-text-error" />
          </div>
          <div>
            <h3 className="vibe-text-bold vibe-text-error vibe-mb-1">
              {t('waitDeliveryTitle')}
            </h3>
            <p className="vibe-text-muted vibe-text-sm vibe-text-medium vibe-leading-relaxed">
              {t('waitDeliveryMessage')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="vibe-text-xs-bold-muted-caps vibe-self-end vibe-hover-foreground vibe-transition"
        >
          {t('cancelButton')}
        </button>
      </div>
    );
  }

  if (canCancelNow) {
    return (
      <div className="vibe-card">
        <h3 className="vibe-text-xl-bold vibe-text-foreground vibe-mb-2">
          {t('cancelOrder')}
        </h3>
        <p className="vibe-text-sm vibe-text-muted vibe-text-medium vibe-mb-6">
          {t('cancelOrderDesc')}
        </p>
        <div className="vibe-flex-gap-4">
          <button
            onClick={() => setIsOpen(false)}
            className="vibe-flex-1 vibe-button-secondary vibe-h-12"
          >
            {t('cancelButton')}
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isSubmitting}
            className="vibe-flex-2 vibe-button-primary vibe-bg-error vibe-hover-error-dark vibe-h-12"
          >
            <XCircle className="vibe-w-5 vibe-h-5" />
            <span>{isSubmitting ? t('cancelling') : t('cancelOrder')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (isDelivered) {
    return (
      <div className="vibe-card vibe-overflow-hidden">
        <h3 className="vibe-text-xl-bold vibe-text-foreground vibe-mb-2">
          {t('requestTitle')}
        </h3>
        <p className="vibe-text-sm vibe-text-muted vibe-text-medium vibe-mb-8">
          {t('requestDescription')}
        </p>

        <form onSubmit={handleSubmitRefund} className="vibe-stack-y-6">
          <div className="vibe-stack-y-2">
            <label className="vibe-text-xs-bold-muted-caps">
              {t('reasonLabel')}
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="vibe-input vibe-h-auto vibe-py-3 vibe-resize-none"
            />
          </div>

          <div className="vibe-stack-y-2">
            <label className="vibe-text-xs-bold-muted-caps">
              {t('imageLabel')}
            </label>
            <div className="vibe-relative vibe-group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
                className="vibe-abs-inset-0 vibe-w-full vibe-h-full vibe-opacity-0 vibe-cursor-pointer vibe-z-10"
              />
              <div className="vibe-flex-items-center-gap-3 vibe-px-4 vibe-py-3 vibe-border-dashed vibe-card-rounded group-hover:vibe-border-primary-soft vibe-transition-all vibe-bg-muted-soft">
                <div className="vibe-p-2 vibe-bg-background vibe-rounded-full group-hover:vibe-bg-primary-soft vibe-transition-all vibe-shadow-xs">
                  <Camera className="vibe-w-5 vibe-h-5 vibe-text-muted group-hover:vibe-text-primary" />
                </div>
                <span className="vibe-text-sm vibe-text-bold vibe-text-muted group-hover:vibe-text-foreground vibe-overflow-hidden vibe-text-ellipsis vibe-whitespace-nowrap">
                  {image ? image.name : t('imageLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="vibe-flex-gap-4 vibe-pt-4 vibe-section-divider-top">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="vibe-flex-1 vibe-button-secondary vibe-h-12"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="vibe-flex-2 vibe-button-primary vibe-h-12"
            >
              <Send
                className={`vibe-w-4 vibe-h-4 ${isSubmitting ? 'vibe-animate-pulse' : ''}`}
              />
              <span>{isSubmitting ? t('submitting') : t('submit')}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
