"use client";

import { motion } from "framer-motion";
import { FiGlobe, FiExternalLink } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";

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

export default WebsiteCard;
