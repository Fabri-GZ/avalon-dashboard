import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { supabaseAdmin } from "@/app/utils/supabase/admin";
import { NextRequest } from "next/server";

const INTERNAL_ROLES = ['cm', 'pm', 'comercial', 'admin_global'];

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_cancelled", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Error exchanging code:", exchangeError);
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login?error=user_not_found", request.url));
  }

  const roleFromMetadata = user.user_metadata?.role as string | undefined;

  if (roleFromMetadata && INTERNAL_ROLES.includes(roleFromMetadata)) {
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('user_profiles').upsert({
        id: user.id,
        role: roleFromMetadata,
        client_id: null,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // client_user or unknown role: seed profile and redirect to onboarding
  const resolvedRole = roleFromMetadata === 'client_user' ? 'client_user' : 'client_user';
  await supabaseAdmin.from('user_profiles').upsert({
    id: user.id,
    role: resolvedRole,
    client_id: null,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.email,
  }, { onConflict: 'id', ignoreDuplicates: true });

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
