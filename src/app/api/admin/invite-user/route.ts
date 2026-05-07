import { createClient } from "@/app/utils/supabase/server";
import { supabaseAdmin } from "@/app/utils/supabase/admin";
import { NextResponse } from "next/server";

const INTERNAL_ROLES = ['cm', 'pm', 'comercial'] as const;
type InvitableRole = typeof INTERNAL_ROLES[number];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== "admin_global") {
      return NextResponse.json({ error: "Forbidden: Requires Admin Global role" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body as { email?: string; role?: string };

    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields: email and role" }, { status: 400 });
    }

    if (!INTERNAL_ROLES.includes(role as InvitableRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${INTERNAL_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '');
    const redirectTo = `${baseUrl}/auth/callback`;

    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo,
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });

  } catch (error: any) {
    console.error("Unexpected error in invite-user:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
