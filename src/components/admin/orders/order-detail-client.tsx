'use client';

import { useState } from 'react';
import { StatusActions } from './status-actions';

interface OrderDetailClientProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  currentStatus: string;
}

export function OrderDetailClient({
  orderId,
  orderNumber,
  customerName,
  totalAmount,
  currency,
  currentStatus: initialStatus,
}: OrderDetailClientProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <StatusActions
        orderId={orderId}
        orderNumber={orderNumber}
        customerName={customerName}
        totalAmount={totalAmount}
        currency={currency}
        currentStatus={currentStatus}
        onStatusChange={setCurrentStatus}
      />
    </div>
  );
}
