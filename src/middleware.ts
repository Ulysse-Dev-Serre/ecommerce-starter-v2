// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n/config';

const { locales, defaultLocale } = i18n;

const CURRENCY_COOKIE_NAME = 'currency';
const SUPPORTED_CURRENCIES = ['CAD', 'USD'] as const;
type Currency = (typeof SUPPORTED_CURRENCIES)[number];
const DEFAULT_CURRENCY: Currency = 'CAD';

function detectCurrencyFromCountry(countryCode: string | null): Currency {
  if (!countryCode) return DEFAULT_CURRENCY;

  switch (countryCode.toUpperCase()) {
    case 'US':
      return 'USD';
    case 'CA':
    default:
      return 'CAD';
  }
}

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
    (level === 'WARN' && process.env.NODE_ENV !== 'production') || // Warnings en dev/staging
    (level === 'INFO' && process.env.NODE_ENV === 'development'); // Info seulement en dev

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
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Logger seulement les redirections importantes (pas les visites normales)
  if (pathnameIsMissingLocale(pathname)) {
    logMiddleware(
      'WARN',
      {
        requestId,
        action: 'i18n_redirect',
        from: pathname,
        to: `/${defaultLocale}${pathname}`,
        userAgent: req.headers.get('user-agent')?.substring(0, 100),
      },
      'Locale missing - redirecting to default'
    );

    const response = NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}`, req.url),
      301
    );
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Ajouter requestId à toutes les réponses sans logger
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  // Gestion du cookie currency (géolocalisation → devise)
  const existingCurrency = req.cookies.get(CURRENCY_COOKIE_NAME)?.value;

  if (
    !existingCurrency ||
    !SUPPORTED_CURRENCIES.includes(existingCurrency as Currency)
  ) {
    // Détecter le pays via headers (Vercel, Cloudflare, ou autre CDN)
    const countryCode =
      req.headers.get('x-vercel-ip-country') ??
      req.headers.get('cf-ipcountry') ??
      req.headers.get('x-country-code') ??
      null;

    const detectedCurrency = detectCurrencyFromCountry(countryCode);

    response.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
      httpOnly: false, // Accessible côté client pour le sélecteur
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 an
      path: '/',
    });

    logMiddleware(
      'INFO',
      {
        requestId,
        action: 'currency_detected',
        countryCode: countryCode ?? 'unknown',
        currency: detectedCurrency,
      },
      'Currency detected from geolocation'
    );
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
