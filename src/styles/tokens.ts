/**
 * Site Design Tokens
 *
 * Ces valeurs reflètent src/styles/globals.css
 * Elles sont utilisées par les composants JS qui ne peuvent pas lire les variables CSS
 * (ex: Stripe Elements, Emails, Canvas, etc.)
 *
 * ⚠️ Si vous modifiez neutral.css, pensez à mettre à jour ce fichier.
 */

export const siteTokens = {
  colors: {
    primary: '#3b82f6', // blue-500
    foreground: '#0f172a', // slate-900
    text: '#0f172a', // slate-900 (alias for clarity in non-css contexts)
    mutedForeground: '#64748b', // slate-500
    border: '#e2e8f0', // slate-200
    error: '#ef4444', // red-500
  },
} as const;
