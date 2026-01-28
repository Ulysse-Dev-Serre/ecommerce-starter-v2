import { OrderStatus } from '@/generated/prisma';
import { cn } from '@/lib/utils/cn';

interface StatusBadgeProps {
  status: string | OrderStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const getStatusClass = (s: string) => {
    switch (s) {
      case 'PAID':
        return 'vibe-badge-success';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'vibe-badge-info';
      case 'DELIVERED':
        return 'vibe-badge-primary';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'vibe-badge-error';
      case 'REFUND_REQUESTED':
        return 'vibe-badge-urgent';
      case 'PENDING':
      default:
        return 'vibe-badge-muted';
    }
  };

  return (
    <span
      className={cn('vibe-badge', getStatusClass(status as string), className)}
    >
      {label || status}
    </span>
  );
}
