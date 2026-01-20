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

  // Logic based on status
  const canCancelNow = status === 'PAID';
  const isShipmentInProgress = status === 'SHIPPED' || status === 'IN_TRANSIT';
  const isDelivered = status === 'DELIVERED';

  if (isSubmitted) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-100 p-6 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-green-900 mb-2">
          {t('successTitle')}
        </h3>
        <p className="text-green-700 text-sm">{t('successMessage')}</p>
      </div>
    );
  }

  // Common "Open" button shown for all states initially
  if (!isOpen) {
    // Only show if it's potentially refundable/cancellable
    const showButton = canCancelNow || isShipmentInProgress || isDelivered;
    if (!showButton) return null;

    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all group"
      >
        <AlertCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">
          {canCancelNow ? t('cancelDelivery') : t('openButton')}
        </span>
      </button>
    );
  }

  // Case 1: Shipment in progress - Warning message
  if (isShipmentInProgress) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-900 mb-1">
              {t('waitDeliveryTitle')}
            </h3>
            <p className="text-red-700 text-sm leading-relaxed">
              {t('waitDeliveryMessage')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm font-bold text-red-900/60 hover:text-red-900 transition-colors self-end"
        >
          {t('cancelButton')}
        </button>
      </div>
    );
  }

  // Case 2: Paid but no label - Simple cancellation
  if (canCancelNow) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {t('cancelOrder')}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{t('cancelOrderDesc')}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('cancelButton')}
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isSubmitting}
            className="flex-2 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
            {isSubmitting ? t('cancelling') : t('cancelOrder')}
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Delivered - Normal Refund Form
  if (isDelivered) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {t('requestTitle')}
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {t('requestDescription')}
          </p>

          <form onSubmit={handleSubmitRefund} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('reasonLabel')}
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('imageLabel')}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImage(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg group-hover:border-gray-300 transition-all">
                  <div className="p-2 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-all">
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">
                    {image ? image.name : t('imageLabel')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
              >
                {t('cancelButton')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="flex-2 flex items-center justify-center gap-2 px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all"
              >
                <Send
                  className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`}
                />
                {isSubmitting ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
