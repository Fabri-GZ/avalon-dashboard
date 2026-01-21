import { FaFacebook, FaInstagram } from "react-icons/fa";
import { FiUser } from "react-icons/fi";

export const formatRelativeDate = (dateString) => {
  if (!dateString) return "Sin sincronizar";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
};

export const formatOnboardingDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const getProviderIcon = (provider) => {
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
