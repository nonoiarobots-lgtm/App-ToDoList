import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes publiques — pas de vérification JWT
const ROUTES_PUBLIQUES = [
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/keepalive', // protégée par CRON_SECRET dans la route elle-même
  '/api/cron', // rappels email — protégés par CRON_SECRET dans la route elle-même
];

// Next 16 : la convention "middleware.ts" est remplacée par "proxy.ts"
export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Laisser passer les routes publiques
  if (ROUTES_PUBLIQUES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Laisser passer les assets statiques et la PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png'
  ) {
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalide le JWT auprès de Supabase (recommandé vs getSession)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // Routes API → retourner 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Session expirée — reconnecte-toi.', status: 401 } },
        { status: 401 }
      );
    }
    // Routes pages → rediriger vers /login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
