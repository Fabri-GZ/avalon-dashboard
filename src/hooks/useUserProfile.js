"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";

export function useUserProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    };

    loadProfile();
  }, []);

  return profile;
}
