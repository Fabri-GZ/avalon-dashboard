import { createClient } from "@/app/utils/supabase/server";
import { supabaseAdmin } from "@/app/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== "admin_global") {
      return NextResponse.json({ error: "Forbidden: Requires Admin Global role" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      full_name,
      company_name,
      industry,
      services,
      phone,
      onboarding_date
    } = body;

    if (!email || !password || !company_name || !onboarding_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dateParts = onboarding_date.split("/");
    if (dateParts.length !== 3) {
      return NextResponse.json({ error: "Invalid date format. Use DD/MM/YYYY" }, { status: 400 });
    }
    
    const [day, month, year] = dateParts;
    const formattedDate = `${year}-${month}-${day}`;

    const timestamp = Date.parse(formattedDate);
    if (isNaN(timestamp)) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }

    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (createUserError || !authData.user) {
      console.error("Error creating auth user:", createUserError);
      return NextResponse.json({ error: createUserError?.message || "Failed to create user" }, { status: 500 });
    }

    const newUserId = authData.user.id;

    let servicesContracted = services;

    const { data: newClient, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert({
        company_name,
        industry,
        services_contracted: servicesContracted,
        onboarding_date: formattedDate,
        status: "active"
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating client record:", clientError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: `Client creation failed: ${clientError.message}` }, { status: 500 });
    }

    const { error: profileInsertError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: newUserId,
        client_id: newClient.id,
        full_name,
        phone,
        role: "client_user",
        email: email
      });

    if (profileInsertError) {
      console.error("Error creating user profile:", profileInsertError);
      await supabaseAdmin.from("clients").delete().eq("id", newClient.id);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: `User profile creation failed: ${profileInsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clientId: newClient.id,
      userId: newUserId
    });

  } catch (error: any) {
    console.error("Unexpected error in create-client:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
