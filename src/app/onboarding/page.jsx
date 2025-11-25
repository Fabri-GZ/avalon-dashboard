"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2, Globe, Share2, DollarSign } from "lucide-react";
import { completeOnboarding } from "@/lib/auth-actions";
import { ToastContainer, toast } from "react-toastify";

const OnboardingPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    services: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const services = [
    { id: "social_media", label: "Manejo de Redes Sociales", icon: Share2 },
    { id: "website", label: "Sitio Web + Analytics", icon: Globe },
    { id: "ads", label: "Google Ads", icon: DollarSign },
  ];

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || formData.services.length === 0) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
        const form = new FormData();
        form.append("companyName", formData.companyName);
        form.append("industry", formData.industry);
        form.append("services", JSON.stringify(formData.services));

        await completeOnboarding(form);
        toast.success("¡Onboarding completado! Redirigiendo...");
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
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido a Avalon!
          </h1>
          <p className="text-muted-foreground">
            Completá estos datos para personalizar tu dashboard
          </p>
        </div>

        <div className="space-y-6">
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
              Industria
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Ej: Retail, Tecnología, Salud..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              ¿Qué servicios contrataste? *
            </label>
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
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground">{service.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
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
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Procesando..." : "Completar configuración"}
          </motion.button>
        </div>

        <ToastContainer />
      </motion.div>
    </div>
  );
};

export default OnboardingPage;