import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { requiredSectionFor, defaultRouteForRole, KNOWN_ROLES } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: any) => {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  const guestOnlyRoutes = ['/login', '/signup', '/forgot-password'];
  const isGuestOnlyRoute = guestOnlyRoutes.some(route => pathname.startsWith(route));

  if (!user && !isPublicRoute && pathname !== '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('client_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.redirect(new URL('/login?error=no_profile', request.url));
    }

    const role = profile.role as Role;

    if (!KNOWN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/login?error=unknown_role', request.url));
    }

    // /dashboard root → role-default route, at the edge BEFORE any React render.
    // Doing this here (instead of /dashboard/page.jsx's server redirect) avoids
    // a hydration race in app-router.tsx that throws React #310 on first load
    // when SSR streaming bridges the redirect.
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }

    // client_user onboarding guard
    if (role === 'client_user') {
      if (!profile.client_id) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }

      const { data: client } = await supabase
        .from('clients')
        .select('onboarding_completed')
        .eq('id', profile.client_id)
        .single();

      if (!client?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    const requiredSection = requiredSectionFor(pathname);

    if (requiredSection) {
      const { data: perms } = await supabase
        .from('section_permissions')
        .select('section_key')
        .eq('role', role);

      const allowed = (perms ?? []).map((p: { section_key: string }) => p.section_key);

      if (!allowed.includes(requiredSection)) {
        return NextResponse.redirect(
          new URL(defaultRouteForRole(role), request.url)
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
