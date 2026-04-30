"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Upload } from "lucide-react";
import { completeOnboarding } from "@/lib/auth-actions";
import { ToastContainer, toast } from "react-toastify";
import Loader from "@/app/components/Loader/loader";

const OnboardingPage = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    logo: null,
    logoPreview: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file, logoPreview: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.phone) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("companyName", formData.companyName);
      form.append("phone", formData.phone);
      form.append("industry", "");
      form.append("services", JSON.stringify([]));
      if (formData.logo) form.append("logo", formData.logo);

      await completeOnboarding(form);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error. Intenta nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      {isLoading && <Loader />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl shadow-xl max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">¡Bienvenido a Avalon!</h1>
          <p className="text-muted-foreground">Completá los datos de tu empresa para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre de tu empresa *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Ej: Mi Empresa SRL"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: +54 11 1234-5678"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Logo de la empresa
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Upload className="w-5 h-5" /> Subir Logo
              </label>
              {formData.logoPreview && (
                <img
                  src={formData.logoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Procesando..." : "Completar configuración"}
          </motion.button>
        </form>

        <ToastContainer />
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
