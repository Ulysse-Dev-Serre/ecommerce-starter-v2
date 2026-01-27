import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n/config';
import { env } from '@/lib/env';

const { locales, defaultLocale } = i18n;

// Fonction simple pour générer un ID unique compatible Edge Runtime
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function pathnameIsMissingLocale(pathname: string): boolean {
  return locales.every(
    (locale: string) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );
}

// Logger minimal pour middleware - seulement erreurs et redirections importantes
function logMiddleware(
  level: 'INFO' | 'WARN' | 'ERROR',
  data: Record<string, unknown>,
  message: string
): void {
  const shouldLog =
    level === 'ERROR' || // Toujours logger les erreurs
    (level === 'WARN' && env.NODE_ENV !== 'production') || // Warnings en dev/staging
    (level === 'INFO' && env.NODE_ENV === 'development'); // Info seulement en dev

  if (shouldLog) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      service: 'middleware',
      ...data,
      message,
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.info(JSON.stringify(logEntry));
    }
  }
}

export default clerkMiddleware((auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const requestId = req.headers.get('x-request-id') ?? generateRequestId();

  // Ignorer les fichiers statiques silencieusement
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // NE PAS rediriger les routes API vers une locale
  // On les laisse passer pour que Clerk puisse les traiter, mais on arrête le middleware ici
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Logger seulement les redirections importantes (pas les visites normales)
  if (pathnameIsMissingLocale(pathname)) {
    let targetLocale: string = defaultLocale;

    // Si c'est une route admin, on utilise ADMIN_LOCALE
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
        userAgent: req.headers.get('user-agent')?.substring(0, 100),
      },
      'Locale missing - redirecting to default'
    );

    const response = NextResponse.redirect(
      new URL(`/${targetLocale}${pathname}`, req.url),
      301
    );
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Ajouter requestId à toutes les réponses sans logger
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
