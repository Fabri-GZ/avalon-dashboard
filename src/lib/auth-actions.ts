"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../app/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) redirect("/error");

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(`client_id`)
      .eq("id", user.id)
      .single();

     if (profileError || !profile?.client_id) {
      revalidatePath("/", "layout");
      redirect("/onboarding");
    }
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('onboarding_completed')
        .eq('id', profile.client_id)
        .single();
      if (clientError || !client?.onboarding_completed) {
        revalidatePath("/", "layout");
        redirect("/onboarding");
      }
    }
    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const companyName = formData.get("companyName") as string;
  const industry = formData.get("industry") as string;
  const services = JSON.parse(formData.get("services") as string);

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      company_name: companyName,
      industry: industry,
      services_contracted: services,
      onboarding_completed: false, 
    })
    .select()
    .single();

  if (clientError) {
    console.error("Error creating client:", clientError);
    throw clientError;
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ client_id: client.id })
    .eq('id', user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    throw profileError;
  }

  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          company_name: companyName,
          services: services,
          user_id: user.id,
        }),
      });
    } catch (error) {
      console.error("Error calling n8n:", error);
    }
  }

  revalidatePath("/", "layout");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const payload = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        full_name: formData.get("name") as string,
        email: formData.get("email") as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
    },
  };

  const { data, error } = await supabase.auth.signUp(payload);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    user: data.user,
  };
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Reset password error:", error);
    throw error;
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const newPassword = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Update password error:", error);
    throw error;
  }

  return { success: true };
}

