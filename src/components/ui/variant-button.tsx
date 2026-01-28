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
        'vibe-variant-button',
        isSelected
          ? 'vibe-variant-button-selected'
          : isAvailable
            ? 'vibe-variant-button-available'
            : 'vibe-variant-button-unavailable',
        className
      )}
    >
      {label}
    </button>
  );
}
