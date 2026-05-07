import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";
import InviteUserForm from "./InviteUserForm";

export default async function InviteUserPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin_global") {
    redirect("/dashboard");
  }

  return <InviteUserForm />;
}
