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
    <div className="space-y-8 py-8">
      <div className="border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted-foreground mt-4 flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {lastUpdated}
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80 font-medium">
          {content}
        </p>
      </div>
    </div>
  );
}
