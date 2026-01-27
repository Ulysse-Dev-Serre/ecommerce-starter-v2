import React from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen animate-in fade-in duration-500">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="vibe-container">
          <article className="prose prose-stone dark:prose-invert max-w-none hover:prose-a:text-primary transition-colors">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
