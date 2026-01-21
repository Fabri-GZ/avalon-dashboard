"use client";

import { motion } from "framer-motion";
import { FiUser, FiCalendar } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";
import { formatOnboardingDate } from "./utils";
import { StatusBadge, ServiceBadge } from "./badges";

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

export default CompanyProfileCard;
