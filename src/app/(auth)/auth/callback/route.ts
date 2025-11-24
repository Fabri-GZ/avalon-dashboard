import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { NextRequest } from "next/server";

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

  return NextResponse.redirect(new URL("/dashboard", request.url));
}