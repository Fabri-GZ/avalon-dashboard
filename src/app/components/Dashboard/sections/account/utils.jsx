import { FaFacebook, FaInstagram } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { formatRelativeTime } from '@/app/utils/relativeTime';

export const formatRelativeDate = (dateString) => {
  if (!dateString) return "Sin sincronizar";
  return formatRelativeTime(dateString);
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
