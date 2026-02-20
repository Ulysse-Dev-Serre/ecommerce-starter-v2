'use client';

import { useState } from 'react';

import { Camera, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { submitRefundRequest } from '@/lib/client/orders';

import { useToast } from '@/components/ui/toast-provider';

interface RefundRequestFormProps {
  orderId: string;
  orderNumber: string;
  locale: string;
  status: string;
  hasLabel: boolean;
}

export function RefundRequestForm({
  orderId,
  orderNumber: _orderNumber,
  locale: _locale,
  status,
  hasLabel: _hasLabel,
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
      const fd = new FormData();
      fd.append('orderId', orderId);
      fd.append('reason', t('cancelOrder'));
      fd.append('type', 'CANCELLATION');

      await submitRefundRequest(orderId, fd);

      setIsSubmitted(true);
      showToast(t('successTitle'), 'success');
      window.location.reload();
    } catch {
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
      await submitRefundRequest(orderId, formData);
      setIsSubmitted(true);
      showToast(t('successTitle'), 'success');
      window.location.reload();
    } catch {
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
      <div className="bg-success/10 rounded-xl border border-success/20 vibe-p-6 text-center">
        <div className="vibe-flex-center mb-4">
          <CheckCircle2 className="vibe-w-12 vibe-h-12 text-success" />
        </div>
        <h3 className="vibe-text-lg-bold text-success vibe-mb-2">
          {t('successTitle')}
        </h3>
        <p className="font-medium text-muted-foreground vibe-text-sm">
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
        className="vibe-w-full flex items-center justify-center gap-2 vibe-px-6 vibe-py-4 vibe-bg-transparent vibe-border-dashed vibe-card-rounded text-muted-foreground hover:border-primary/20 hover:text-primary transition-all duration-300 group"
      >
        <AlertCircle className="vibe-w-5 vibe-h-5 group-hover:scale-110 vibe-transition-transform" />
        <span className="vibe-text-xs-bold-caps">
          {canCancelNow ? t('cancelDelivery') : t('openButton')}
        </span>
      </button>
    );
  }

  if (isShipmentInProgress) {
    return (
      <div className="bg-error/5 rounded-xl border border-error/20 flex flex-col vibe-p-6 flex flex-col gap-4">
        <div className="flex gap-4 vibe-items-start">
          <div className="vibe-p-2 bg-error/10 vibe-rounded-full">
            <AlertCircle className="vibe-w-6 vibe-h-6 text-error" />
          </div>
          <div>
            <h3 className="font-bold text-error vibe-mb-1">
              {t('waitDeliveryTitle')}
            </h3>
            <p className="text-muted-foreground vibe-text-sm font-medium leading-relaxed">
              {t('waitDeliveryMessage')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground vibe-self-end vibe-hover-foreground transition-all duration-300"
        >
          {t('cancelButton')}
        </button>
      </div>
    );
  }

  if (canCancelNow) {
    return (
      <div className="vibe-card">
        <h3 className="text-xl font-bold text-foreground text-foreground vibe-mb-2">
          {t('cancelOrder')}
        </h3>
        <p className="vibe-text-sm text-muted-foreground font-medium mb-6">
          {t('cancelOrderDesc')}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 vibe-button-secondary vibe-h-12"
          >
            {t('cancelButton')}
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isSubmitting}
            className="flex-[2] vibe-button-primary vibe-bg-error hover:bg-error/90 vibe-h-12"
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
        <h3 className="text-xl font-bold text-foreground text-foreground vibe-mb-2">
          {t('requestTitle')}
        </h3>
        <p className="vibe-text-sm text-muted-foreground font-medium vibe-mb-8">
          {t('requestDescription')}
        </p>

        <form onSubmit={handleSubmitRefund} className="space-y-6">
          <div className="vibe-stack-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('reasonLabel')}
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="vibe-input h-auto vibe-py-3 resize-none"
            />
          </div>

          <div className="vibe-stack-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('imageLabel')}
            </label>
            <div className="relative vibe-group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
                className="absolute inset-0 vibe-w-full vibe-h-full vibe-opacity-0 vibe-cursor-pointer z-10"
              />
              <div className="flex items-center gap-3 px-4 vibe-py-3 vibe-border-dashed vibe-card-rounded group-hover:border-primary/20 transition-all duration-300 bg-muted/30">
                <div className="vibe-p-2 bg-background vibe-rounded-full group-hover:bg-primary/5 transition-all duration-300 shadow-sm">
                  <Camera className="vibe-w-5 vibe-h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="vibe-text-sm font-bold text-muted-foreground group-hover:text-foreground vibe-overflow-hidden text-ellipsis vibe-whitespace-nowrap">
                  {image ? image.name : t('imageLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 vibe-pt-4 border-t border-border pt-4 mt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 vibe-button-secondary vibe-h-12"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-[2] vibe-button-primary vibe-h-12"
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
