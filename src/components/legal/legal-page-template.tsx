import React from 'react';

import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/config/vibe-styles';

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
    <div className="space-y-8 py-8 lg:py-12">
      <div className="border-b border-border pb-4 pb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted-foreground mt-4 vibe-flex-items-center-gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {lastUpdated}
        </p>
      </div>

      <div className={VIBE_TYPOGRAPHY_PROSE}>
        <p className="whitespace-pre-line text-lg text-muted-foreground leading-relaxed text-foreground font-medium">
          {content}
        </p>
      </div>
    </div>
  );
}
