"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2, Globe, Share2, DollarSign, Upload, Calendar, Lock, User, Mail, Phone, Briefcase } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserProfile } from "@/hooks/useUserProfile";
import Loader from "@/app/components/Loader/loader";

const AdminCreateClientPage = () => {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phone: "",
    onboarding_date: "",
    industry: "",
    services: [],
  });

 const servicesList = [
    { id: "social_media", label: "Manejo de Redes Sociales", icon: Share2 },
    { id: "website", label: "Sitio Web + Analytics", icon: Globe },
    { id: "ads", label: "Google Ads", icon: DollarSign },
  ];

  useEffect(() => {
    if (!profileLoading) {
        if (!profile || profile.role !== "admin_global") {
            toast.error("Acceso denegado.");
            router.push("/dashboard");
        }
    }
  }, [profile, profileLoading, router]);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
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
    if (step === 1) {
       if(!formData.email || !formData.password || !formData.fullName || !formData.companyName || !formData.phone || !formData.onboarding_date) {
         toast.error("Por favor completa todos los campos del Paso 1");
         return;
       }
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
      const response = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
             email: formData.email,
             password: formData.password,
             full_name: formData.fullName,
             company_name: formData.companyName,
             industry: formData.industry,
             services: formData.services,
             phone: formData.phone,
             onboarding_date: formData.onboarding_date.split('-').reverse().join('/')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear cliente");
      }

      toast.success(`Cliente creado exitosamente (ID: ${data.clientId})`);
      setTimeout(() => router.push("/dashboard"), 2000);

    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
      return <Loader />;
  }
  
  if (profile?.role !== 'admin_global') {
      return null; 
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      {isLoading && <Loader />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl shadow-xl max-w-2xl w-full p-8"
      >
        <div className="flex justify-center mb-8">
           {/* Steps UI matches existing style */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 1 ? 'bg-violet-500' : 'bg-gray-300'}`}>1</div>
          <div className="w-16 h-1 bg-gray-300 mx-2 self-center"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 2 ? 'bg-violet-500' : 'bg-gray-300'}`}>2</div>
        </div>

        <div className="text-center mb-6">
          <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Alta de Nuevo Cliente
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? "Datos de Acceso y Contacto" : "Detalles de Negocio y Servicios"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Cliente *</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                        placeholder="cliente@empresa.com"
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-foreground mb-1">Contraseña *</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <input
                            type="text"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                            placeholder="******"
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={generatePassword}
                            className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                            title="Generar contraseña segura"
                        >
                            Generar
                        </button>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Nombre Completo *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                        placeholder="Juan Pérez"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Teléfono *</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                        placeholder="+54 9 11..."
                        />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Empresa *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                        placeholder="Nombre Fiscal / Fantasía"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Fecha Onboarding *</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                        type="date"
                        value={formData.onboarding_date}
                        onChange={(e) => setFormData({ ...formData, onboarding_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground shadow-sm transition-all scheme-light dark:scheme-dark"
                        />
                    </div>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={nextStep}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg mt-4"
              >
                Siguiente Paso
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
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Servicios Contratados *</label>
                <div className="space-y-3">
                  {servicesList.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.services.includes(service.id);
                    return (
                      <motion.button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceToggle(service.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
                          isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-foreground text-sm">{service.label}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted text-foreground font-medium"
                  >
                    Volver
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? "Creando Cliente..." : "Confirmar Alta"}
                  </motion.button>
              </div>
            </>
          )}
        </form>

        <ToastContainer position="bottom-right" theme="dark" />
      </motion.div>
    </div>
  );
};

export default AdminCreateClientPage;
