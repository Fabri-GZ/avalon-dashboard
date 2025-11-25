"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2, Globe, Share2, DollarSign, Upload } from "lucide-react";
import { completeOnboarding } from "@/lib/auth-actions";
import { ToastContainer, toast } from "react-toastify";

const OnboardingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    logo: null,
    logoPreview: "",
    industry: "",
    services: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const services = [
    { id: "social_media", label: "Manejo de Redes Sociales", icon: Share2 },
    { id: "website", label: "Sitio Web + Analytics", icon: Globe },
    { id: "ads", label: "Google Ads", icon: DollarSign },
  ];

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file, logoPreview: URL.createObjectURL(file) });
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.companyName || !formData.phone || !formData.logo)) {
      toast.error("Completa todos los campos del Paso 1");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.services.length === 0) {
      toast.error("Selecciona al menos un servicio");
      return;
    }

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("companyName", formData.companyName);
      form.append("phone", formData.phone);
      form.append("industry", formData.industry);
      form.append("services", JSON.stringify(formData.services));
      if (formData.logo) form.append("logo", formData.logo);

      await completeOnboarding(form);
      toast.success("¡Onboarding completado!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl shadow-xl max-w-2xl w-full p-8"
      >
        {/* Indicadores de Paso */}
        <div className="flex justify-center mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 1 ? 'bg-violet-500' : 'bg-gray-300'}`}>1</div>
          <div className="w-16 h-1 bg-gray-300 mx-2 self-center"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 2 ? 'bg-violet-500' : 'bg-gray-300'}`}>2</div>
        </div>

        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido a Avalon!
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Completá tus datos básicos" : "Personalizá tu dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre de tu empresa *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ej: Mi Empresa SRL"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Teléfono *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: +54 11 1234-5678"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Logo de la empresa *</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80">
                    <Upload className="w-5 h-5" /> Subir Logo
                  </label>
                  {formData.logoPreview && <img src={formData.logoPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />}
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg"
              >
                Siguiente
              </motion.button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Industria</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Ej: Retail, Tecnología, Salud..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">¿Qué servicios contrataste? *</label>
                <div className="space-y-3">
                  {services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.services.includes(service.id);
                    return (
                      <motion.button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceToggle(service.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                          isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-foreground">{service.label}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-sm">✓</span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Procesando..." : "Completar configuración"}
              </motion.button>
            </>
          )}
        </form>

        <ToastContainer />
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
