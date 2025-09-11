// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

// cette fonction n'est pas utilisée dans ce middleware, mais pourrait être utile ailleurs
function getLocale(pathname: string): string {
  // Vérifier si le chemin commence par une locale
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

function pathnameIsMissingLocale(pathname: string): boolean {
  return locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );
}

export default clerkMiddleware((auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Ignorer les fichiers statiques et les routes API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Rediriger si la locale est manquante
  if (pathnameIsMissingLocale(pathname)) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};