"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!user) {
           setLoading(false);
           return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return { profile, loading, error };
}
