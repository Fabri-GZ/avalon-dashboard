"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, FiCalendar, FiLock, FiEye, FiEyeOff, 
  FiFileText, FiFolderPlus, FiGlobe, FiAlertCircle,
  FiExternalLink
} from "react-icons/fi";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { useAccountData } from "@/hooks/useAccountData";
import { containerVariants, cardVariants } from "../data/dataProcessors";


const formatRelativeDate = (dateString) => {
  if (!dateString) return "Sin sincronizar";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
};

const formatOnboardingDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getProviderIcon = (provider) => {
  const iconClass = "w-5 h-5";
  switch (provider?.toLowerCase()) {
    case 'facebook':
      return <FaFacebook className={`${iconClass} text-blue-600`} />;
    case 'instagram':
      return <FaInstagram className={`${iconClass} text-pink-500`} />;
    default:
      return <FiUser className={`${iconClass} text-muted-foreground`} />;
  }
};

const ServiceBadge = ({ service }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
  >
    {service}
  </motion.span>
);

const StatusBadge = ({ status }) => {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      isActive 
        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' 
        : 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
    }`}>
      {isActive ? 'Activo' : 'En baja'}
    </span>
  );
};

const CompanyProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className="bg-background rounded-xl p-6 border border-secondary"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {profile.logo_url ? (
            <img 
              src={profile.logo_url} 
              alt={`Logo de ${profile.company_name}`}
              className="w-16 h-16 rounded-xl object-cover border border-secondary shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-secondary">
              <FiUser className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-foreground truncate">
              {profile.company_name}
            </h2>
            <StatusBadge status={profile.status} />
          </div>

          {profile.onboarding_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <FiCalendar className="w-4 h-4" />
              <span>Cliente desde {formatOnboardingDate(profile.onboarding_date)}</span>
            </div>
          )}

          {profile.services_contracted && profile.services_contracted.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.services_contracted.map((service, idx) => (
                <ServiceBadge key={idx} service={service} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CredentialsCard = ({ credentials }) => {
  const [visiblePasswords, setVisiblePasswords] = useState({});

  if (!credentials || credentials.length === 0) return null;

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      className="bg-background rounded-xl p-8 border border-secondary h-full"
    >
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <FiLock className="w-6 h-6 text-primary" />
        </div>
        Accesos
      </h3>

      <div className="space-y-4">
        {credentials.map((cred, index) => (
          <motion.div
            key={cred.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-xl bg-secondary/30 border border-secondary hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-background border border-secondary shrink-0">
                {getProviderIcon(cred.provider)}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {cred.provider || 'Credencial'}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {formatRelativeDate(cred.last_sync_at)}
                  </span>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20">Usuario:</span>
                    <span className="text-sm font-medium text-foreground">{cred.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20">Contraseña:</span>
                    <span className="text-sm font-mono text-foreground">
                      {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(cred.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title={visiblePasswords[cred.id] ? "Ocultar" : "Mostrar"}
                    >
                      {visiblePasswords[cred.id] ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const WebsiteCard = ({ websiteResource }) => {
  if (!websiteResource) return null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      className="bg-background rounded-xl p-5 border border-secondary h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <FiGlobe className="w-4 h-4 text-primary" />
        Sitio Web
      </h3>
      
      <div className="flex-1 mb-3 rounded-lg overflow-hidden border border-secondary bg-secondary/30">
        <div className="aspect-4/3 relative">
          <iframe
            src={websiteResource.url}
            title="Website preview"
            className="absolute inset-0 w-full h-full pointer-events-none scale-[1.01]"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground truncate flex-1">
          {websiteResource.url}
        </p>
        <a
          href={websiteResource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 border border-secondary hover:border-primary/30 transition-all font-medium text-xs text-foreground"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          Abrir
        </a>
      </div>
    </motion.div>
  );
};

const ReportsCard = ({ reports }) => {
  if (!reports || reports.length === 0) return null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className="bg-background rounded-xl p-4 border border-secondary min-h-[180px] flex flex-col"
    >
      <h3 className="text-md font-semibold text-foreground mb-3 flex items-center gap-2">
        <FiFileText className="w-5 h-5 text-primary" />
        Reportes
      </h3>
      <div className="space-y-1.5">
        {reports.map((report) => (
          <a
            key={report.id}
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
          >
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {report.title || 'Ver reporte'}
            </span>
            <FiExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </a>
        ))}
      </div>
    </motion.div>
  );
};

const DriveCard = ({ driveResource }) => {
  if (!driveResource) return null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className="bg-background rounded-xl p-4 border border-secondary min-h-[180px] flex flex-col"
    >
      <h3 className="text-md font-semibold text-foreground mb-3 flex items-center gap-2">
        <FiFolderPlus className="w-5 h-5 text-primary" />
        Drive
      </h3>
      <a
        href={driveResource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group font-medium text-sm text-foreground w-full"
      >
        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              Abrir Carpeta
        </span>
        <FiExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </a>
    </motion.div>
  );
};

const AccountStatusCard = ({ 
  status, 
  isAdmin, 
  onRequestOffboarding, 
  isUpdating 
}) => {
  const [showModal, setShowModal] = useState(false);
  if (!isAdmin) return null;

  const isOffboarding = status === 'offboarding';

  const handleConfirm = async () => {
    await onRequestOffboarding();
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
        className="bg-background rounded-xl p-6 border-2 border-dashed border-destructive/30"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FiAlertCircle className="w-5 h-5 text-destructive" />
          Estado de la cuenta
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Estado actual:</p>
            <StatusBadge status={status} />
          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={isOffboarding || isUpdating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isOffboarding || isUpdating
                ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
          >
            {isUpdating ? 'Procesando...' : isOffboarding ? 'Baja solicitada' : 'Solicitar baja'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 border border-secondary shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <FiAlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">
                  Confirmar solicitud de baja
                </h4>
              </div>

              <p className="text-muted-foreground mb-6">
                ¿Estás seguro de que deseas solicitar la baja de esta cuenta? 
                Esta acción cambiará el estado a "En baja".
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-secondary text-foreground hover:bg-secondary/50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Procesando...' : 'Confirmar baja'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const AccountSection = ({ client, userRole }) => {
  const {
    clientProfile,
    credentials,
    reports,
    driveResource,
    websiteResource,
    loading,
    error,
    isUpdatingStatus,
    requestOffboarding
  } = useAccountData(client?.id);

  const isAdmin = userRole === 'admin_global';

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <FiAlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar datos de la cuenta</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </motion.div>
    );
  }

  const hasSecondaryResources = (reports && reports.length > 0) || driveResource;

  return (
    <motion.div
      key="account"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <CompanyProfileCard profile={clientProfile} />

      {(credentials.length > 0 || websiteResource) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CredentialsCard credentials={credentials} />
          </div>
          <div className="lg:col-span-1">
            <WebsiteCard websiteResource={websiteResource} />
          </div>
        </div>
      )}

      {hasSecondaryResources && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReportsCard reports={reports} />
          <DriveCard driveResource={driveResource} />
        </div>
      )}

      <AccountStatusCard
        status={clientProfile?.status}
        isAdmin={isAdmin}
        onRequestOffboarding={requestOffboarding}
        isUpdating={isUpdatingStatus}
      />
    </motion.div>
  );
};

export default AccountSection;
