import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/config/vibe-styles';
import React from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen duration-500 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vibe-container-max-4xl">
        <div className="vibe-container">
          <article className={VIBE_TYPOGRAPHY_PROSE}>{children}</article>
        </div>
      </div>
    </div>
  );
}
