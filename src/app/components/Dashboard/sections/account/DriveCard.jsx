"use client";

import { motion } from "framer-motion";
import { FiFolderPlus, FiExternalLink } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";

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

export default DriveCard;
