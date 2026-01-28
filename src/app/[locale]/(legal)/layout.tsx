import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/vibe-styles';
import React from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="vibe-bg-background vibe-min-h-screen vibe-animate-fade-in vibe-section-py">
      <div className="vibe-layout-container vibe-container-max-4xl">
        <div className="vibe-container">
          <article className={VIBE_TYPOGRAPHY_PROSE}>{children}</article>
        </div>
      </div>
    </div>
  );
}
