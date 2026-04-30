"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiCamera, FiCheck, FiEdit3, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { cardVariants } from "../../data/dataProcessors";
import { validateProfileFields } from "@/hooks/useSettingsData";
import { cn } from "@/lib/utils";

const ProfileCard = ({ profile, saving, onUpdateProfile, onUpdateEmail, onUpdateAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.auth_email || profile?.email || "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || "");
      setEmail(profile?.auth_email || profile?.email || "");
    }
  }, [profile, isEditing]);

  const initialEmail = profile?.auth_email || profile?.email || "";
  const emailChanged = email !== initialEmail;

  const handleEditClick = () => {
    setIsEditing(true);
    setFieldErrors({});
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setEmail(profile?.auth_email || profile?.email || "");
    setFieldErrors({});
    toast.info("Edición cancelada");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    const result = await onUpdateAvatar(file);
    if (result.success) {
      toast.success("Avatar actualizado correctamente");
    } else {
      setAvatarPreview(null);
      toast.error(result.error || "Error al actualizar avatar");
    }
  };

  const handleSaveProfile = async () => {
    setFieldErrors({});

    const validation = validateProfileFields({ full_name: fullName, phone, email });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    const profileResult = await onUpdateProfile({ full_name: fullName, phone });
    if (!profileResult.success) {
      toast.error(profileResult.error || "Error al guardar");
      if (profileResult.errors) setFieldErrors(profileResult.errors);
      return;
    }

    if (emailChanged) {
      const emailResult = await onUpdateEmail(email);
      if (emailResult.success) {
        toast.info(emailResult.message);
      } else {
        toast.error(emailResult.error);
        return;
      }
    } else {
      toast.success("Perfil actualizado correctamente");
    }

    setIsEditing(false);
  };

  const avatarSrc = avatarPreview || profile?.avatar_url;

  return (
    <motion.div
      variants={cardVariants}
      className="bg-background rounded-3xl border border-border/60 p-10 shadow-xl shadow-foreground/5"
    >
      <div className="flex flex-col xl:flex-row gap-12">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-6 shrink-0">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-secondary shadow-2xl relative transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-primary/20">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                  <FiUser className="w-16 h-16 text-primary/40" />
                </div>
              )}
              
              <label className="absolute inset-0 bg-primary/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer text-white">
                <FiCamera className="w-8 h-8 mb-2 animate-bounce-subtle" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Cambiar</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            {saving && (
              <div className="absolute inset-0 rounded-[2.5rem] bg-background/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-foreground">Foto de Perfil</h4>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Información del Perfil</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 p-8 rounded-3xl bg-secondary/20 border border-secondary/30 relative overflow-hidden">
            {/* Background elements for aesthetic */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="space-y-3 relative z-10">
              <label className="text-[11px] font-extrabold text-primary/60 uppercase tracking-[0.15em] ml-1">Nombre Completo</label>
              <div className="min-h-[60px] flex items-center">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={cn(
                        "w-full px-5 py-4 bg-background rounded-2xl text-foreground font-semibold border-2 transition-all outline-none focus:ring-4 focus:ring-primary/10",
                        fieldErrors.full_name ? "border-destructive" : "border-border hover:border-primary/40 focus:border-primary"
                      )}
                    />
                    {fieldErrors.full_name && <p className="text-[10px] text-destructive mt-2 font-bold ml-1">{fieldErrors.full_name}</p>}
                  </motion.div>
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-foreground py-2 px-1">
                    {fullName || "—"}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <label className="text-[11px] font-extrabold text-primary/60 uppercase tracking-[0.15em] ml-1">Correo Electrónico</label>
              <div className="min-h-[60px] flex items-center">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <input
                      type="email"
                      value={email}
                      disabled={true}
                      className="w-full px-5 py-4 bg-muted/30 rounded-2xl border border-border/40 text-muted-foreground font-medium cursor-not-allowed"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 ml-1 flex items-center gap-1">
                      <FiCheck className="w-3 h-3" /> Requisito de sistema
                    </p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2 px-1 overflow-hidden">
                    <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                      <FiMail className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-foreground truncate block max-w-[280px]">{email || "—"}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="space-y-3 relative z-10 md:col-span-2">
              <label className="text-[11px] font-extrabold text-primary/60 uppercase tracking-[0.15em] ml-1">Número de teléfono</label>
              <div className="min-h-[60px] flex items-center">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(
                        "w-full px-5 py-4 bg-background rounded-2xl text-foreground font-semibold border-2 transition-all outline-none focus:ring-4 focus:ring-primary/10",
                        fieldErrors.phone ? "border-destructive" : "border-border hover:border-primary/40 focus:border-primary"
                      )}
                    />
                    {fieldErrors.phone && <p className="text-[10px] text-destructive mt-2 font-bold ml-1">{fieldErrors.phone}</p>}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2 px-1">
                    <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                      <FiPhone className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-foreground">{phone || "No registrado"}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>



          {/* Action Bar - Fixed Height Container */}
          <div className="pt-8 min-h-[90px] flex items-center justify-end border-t border-border/40 mt-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isEditing ? (
                <motion.button
                  key="edit-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditClick}
                  className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
                >
                  <FiEdit3 className="w-5 h-5" />
                  Editar perfil
                </motion.button>
              ) : (
                <motion.div 
                  key="editing-btns"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"
                >
                  <button
                    onClick={handleCancelClick}
                    disabled={saving}
                    className="w-full md:w-auto px-8 py-4 bg-secondary/50 text-foreground rounded-2xl font-extrabold hover:bg-secondary transition-all flex items-center justify-center gap-3 border border-border"
                  >
                    <FiX className="w-5 h-5 text-muted-foreground" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiCheck className="w-5 h-5" />
                    )}
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;

