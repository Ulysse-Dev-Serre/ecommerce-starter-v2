'use client';

import { cn } from '@/lib/utils/cn';

interface VariantButtonProps {
  label: string;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
  className?: string;
}

export function VariantButton({
  label,
  isSelected,
  isAvailable,
  onClick,
  className,
}: VariantButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        'px-4 py-2 rounded-md border-2 transition cursor-pointer disabled:cursor-not-allowed',
        isSelected
          ? 'border-primary bg-primary text-primary-foreground'
          : isAvailable
            ? 'border-border hover:border-border-focus'
            : 'border-muted text-muted-foreground opacity-50',
        className
      )}
    >
      {label}
    </button>
  );
}
