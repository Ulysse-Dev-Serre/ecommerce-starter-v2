import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/config/vibe-styles';
import React from 'react';

interface LegalPageTemplateProps {
  title: string;
  lastUpdated: string;
  content: string;
}

export function LegalPageTemplate({
  title,
  lastUpdated,
  content,
}: LegalPageTemplateProps) {
  return (
    <div className="vibe-stack-y-8 vibe-section-py">
      <div className="vibe-section-divider-bottom vibe-pb-8">
        <h1 className="vibe-h1-mega">{title}</h1>
        <p className="vibe-text-muted vibe-mt-4 vibe-flex-items-center-gap-2 vibe-text-xs-bold-muted-caps">
          <span className="vibe-badge-dot-primary" />
          {lastUpdated}
        </p>
      </div>

      <div className={VIBE_TYPOGRAPHY_PROSE}>
        <p className="vibe-whitespace-pre-line vibe-text-p-lg vibe-text-foreground vibe-text-medium">
          {content}
        </p>
      </div>
    </div>
  );
}
