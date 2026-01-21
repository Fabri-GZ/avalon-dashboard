import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!user && !isPublicRoute && pathname !== '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }

  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('client_id, role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { role, client_id } = profile;

    if (role === 'admin') {
      return response;
    }

    if (role === 'client_user') {
      if (!client_id) {
        return NextResponse.redirect(
          new URL('/onboarding', request.url)
        );
      }

      const { data: client } = await supabase
        .from('clients')
        .select('onboarding_completed')
        .eq('id', client_id)
        .single();

      if (!client?.onboarding_completed) {
        return NextResponse.redirect(
          new URL('/onboarding', request.url)
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