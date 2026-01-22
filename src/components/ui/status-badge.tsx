import { OrderStatus } from '@/generated/prisma';

interface StatusBadgeProps {
  status: string | OrderStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PAID':
        return 'bg-success/10 text-success border-success/20';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'bg-info/10 text-info border-info/20';
      case 'DELIVERED':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-error/10 text-error border-error/20';
      case 'REFUND_REQUESTED':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'PENDING':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-sm ${getStatusColor(status as string)} ${className || ''}`}
    >
      {label || status}
    </span>
  );
}
