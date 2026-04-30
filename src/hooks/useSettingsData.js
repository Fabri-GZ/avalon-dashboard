"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { resetPassword } from "@/lib/auth-actions";

// --- Validations ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{6,20}$/;

export function validateProfileFields({ full_name, phone, email }) {
  const errors = {};

  if (!full_name || full_name.trim().length === 0) {
    errors.full_name = "El nombre es obligatorio";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = "Email inválido";
  }

  if (phone && phone.trim().length > 0 && !PHONE_REGEX.test(phone)) {
    errors.phone = "Teléfono inválido";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// --- Avatar helpers ---

function extractStoragePath(avatarUrl) {
  if (!avatarUrl) return null;
  try {
    const url = new URL(avatarUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/company-logos\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

// --- Hook ---

export function useSettingsData() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

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

      setProfile({ ...profileData, auth_email: user.email });
    } catch (err) {
      console.error("Error loading settings profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Update name & phone ---
  const updateProfile = useCallback(
    async ({ full_name, phone }) => {
      const validation = validateProfileFields({ full_name, phone, email: profile?.email });
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      try {
        setSaving(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("No user session");

        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ full_name: full_name.trim(), phone: phone?.trim() || null })
          .eq("id", user.id);

        if (updateError) throw updateError;

        setProfile((prev) => ({
          ...prev,
          full_name: full_name.trim(),
          phone: phone?.trim() || null,
        }));

        return { success: true };
      } catch (err) {
        console.error("Error updating profile:", err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [supabase, profile]
  );

  // --- Update email (Supabase sends confirmation) ---
  const updateEmail = useCallback(
    async (newEmail) => {
      if (!newEmail || !EMAIL_REGEX.test(newEmail)) {
        return { success: false, error: "Email inválido" };
      }

      try {
        setSaving(true);
        setError(null);

        const { error: authUpdateError } = await supabase.auth.updateUser({
          email: newEmail,
        });

        if (authUpdateError) throw authUpdateError;

        return {
          success: true,
          requiresConfirmation: true,
          message: "Se envió un email de confirmación a tu nueva dirección. Revisá tu bandeja de entrada.",
        };
      } catch (err) {
        console.error("Error updating email:", err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  // --- Update avatar (upload new → update DB → delete old) ---
  const updateAvatar = useCallback(
    async (file) => {
      if (!file) return { success: false, error: "No se seleccionó archivo" };

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: "Formato no soportado. Usá JPG, PNG, WEBP o GIF." };
      }

      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        return { success: false, error: "La imagen no puede superar los 2MB." };
      }

      try {
        setSaving(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("No user session");

        // Save reference to old avatar for cleanup AFTER success
        const oldAvatarPath = extractStoragePath(profile?.avatar_url);

        // 1. Upload new avatar
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(fileName);

        const newAvatarUrl = publicUrlData.publicUrl;

        // 3. Update user_profiles with new URL
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ avatar_url: newAvatarUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // 4. Only NOW delete old avatar (after upload + DB update succeeded)
        if (oldAvatarPath && oldAvatarPath !== fileName) {
          await supabase.storage.from("company-logos").remove([oldAvatarPath]);
        }

        setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));

        return { success: true, avatarUrl: newAvatarUrl };
      } catch (err) {
        console.error("Error updating avatar:", err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [supabase, profile]
  );

  // --- Request password reset (reuses existing recovery flow) ---
  const requestPasswordReset = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) throw new Error("No se encontró el email del usuario");

      const formData = new FormData();
      formData.append("email", user.email);

      await resetPassword(formData);

      return {
        success: true,
        message: `Se envió un email de recuperación a ${user.email}`,
      };
    } catch (err) {
      console.error("Error requesting password reset:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [supabase]);

  return {
    profile,
    loading,
    saving,
    error,
    updateProfile,
    updateEmail,
    updateAvatar,
    requestPasswordReset,
    refetch: fetchProfile,
  };
}
