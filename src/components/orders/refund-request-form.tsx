'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast-provider';
import { Camera, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

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
  const t = useTranslations('Orders.refund');

  const handleCancelOrder = async () => {
    if (!confirm(t('confirmCancel'))) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders/refund-request', {
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
      const response = await fetch('/api/orders/refund-request', {
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
      <div className="bg-success/10 rounded-xl border border-success/20 p-6 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h3 className="text-lg font-bold text-success mb-2">
          {t('successTitle')}
        </h3>
        <p className="text-muted-foreground text-sm font-medium">
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
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group"
      >
        <AlertCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-bold uppercase tracking-wider text-xs">
          {canCancelNow ? t('cancelDelivery') : t('openButton')}
        </span>
      </button>
    );
  }

  if (isShipmentInProgress) {
    return (
      <div className="bg-error/5 rounded-xl border border-error/20 p-6 flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-error/10 rounded-full">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <div>
            <h3 className="font-bold text-error mb-1">
              {t('waitDeliveryTitle')}
            </h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              {t('waitDeliveryMessage')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors self-end uppercase tracking-widest"
        >
          {t('cancelButton')}
        </button>
      </div>
    );
  }

  if (canCancelNow) {
    return (
      <div className="vibe-card">
        <h3 className="text-xl font-black text-foreground mb-2">
          {t('cancelOrder')}
        </h3>
        <p className="text-sm text-muted-foreground font-medium mb-6">
          {t('cancelOrderDesc')}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 vibe-button-secondary h-12"
          >
            {t('cancelButton')}
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isSubmitting}
            className="flex-[2] vibe-button-primary bg-error hover:bg-error/90 h-12"
          >
            <XCircle className="w-5 h-5" />
            <span>{isSubmitting ? t('cancelling') : t('cancelOrder')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (isDelivered) {
    return (
      <div className="vibe-card overflow-hidden">
        <h3 className="text-xl font-black text-foreground mb-2">
          {t('requestTitle')}
        </h3>
        <p className="text-sm text-muted-foreground font-medium mb-8">
          {t('requestDescription')}
        </p>

        <form onSubmit={handleSubmitRefund} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('reasonLabel')}
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="vibe-input h-auto py-3 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('imageLabel')}
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-lg group-hover:border-primary/50 transition-all bg-muted/30">
                <div className="p-2 bg-background rounded-full group-hover:bg-primary/10 transition-all shadow-sm">
                  <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                  {image ? image.name : t('imageLabel')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 vibe-button-secondary h-12"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-[2] vibe-button-primary h-12"
            >
              <Send
                className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`}
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
