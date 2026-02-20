import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { env } from '@/lib/core/env';
import { i18n } from '@/lib/i18n/config';

import type { NextRequest } from 'next/server';

const { locales, defaultLocale } = i18n;

// Matchers pour les routes protégées
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/:locale/admin(.*)']);
const isAccountRoute = createRouteMatcher([
  '/account(.*)',
  '/:locale/account(.*)',
  '/orders(.*)',
  '/:locale/orders(.*)',
]);

// Fonction pour générer un ID unique compatible Edge Runtime
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function pathnameIsMissingLocale(pathname: string): boolean {
  return locales.every(
    (locale: string) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );
}

/**
 * Applique les en-têtes de sécurité recommandés
 */
function applySecurityHeaders(response: NextResponse) {
  const headers = response.headers;
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  return response;
}

// Logger minimal pour middleware
function logMiddleware(
  level: 'INFO' | 'WARN' | 'ERROR',
  data: Record<string, unknown>,
  message: string
): void {
  const shouldLog =
    level === 'ERROR' ||
    (level === 'WARN' && env.NODE_ENV !== 'production') ||
    (level === 'INFO' && env.NODE_ENV === 'development');

  if (shouldLog) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      service: 'middleware',
      ...data,
      message,
    };
    console[level.toLowerCase() as 'info' | 'warn' | 'error'](
      JSON.stringify(logEntry)
    );
  }
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const requestId = req.headers.get('x-request-id') ?? generateRequestId();

  // 1. Ignorer les fichiers statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Protection des routes (Centralisée)
  if (isAdminRoute(req)) {
    // Force la protection Clerk pour tout le dossier /admin
    await auth.protect();
  } else if (isAccountRoute(req)) {
    // Optionnel: protéger les comptes et commandes clients
    await auth.protect();
  }

  // 3. Gestion de la locale (I18n)
  if (pathnameIsMissingLocale(pathname) && !pathname.startsWith('/api')) {
    let targetLocale: string = defaultLocale;

    // Si c'est une route admin, on force ADMIN_LOCALE
    if (pathname.startsWith('/admin')) {
      targetLocale = env.ADMIN_LOCALE;
    }

    logMiddleware(
      'WARN',
      {
        requestId,
        action: 'i18n_redirect',
        from: pathname,
        to: `/${targetLocale}${pathname}`,
      },
      'Locale missing - redirecting'
    );

    const redirectResponse = NextResponse.redirect(
      new URL(`/${targetLocale}${pathname}`, req.url),
      301
    );
    redirectResponse.headers.set('x-request-id', requestId);
    return applySecurityHeaders(redirectResponse);
  }

  // 4. Réponse normale avec headers de sécurité
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return applySecurityHeaders(response);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
