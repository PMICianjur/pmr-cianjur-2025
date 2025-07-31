import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Menggunakan cn dari lib/utils

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn("relative group", containerClassName)}>
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 blur-xl transition-all duration-500 group-hover:blur-lg"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-3xl overflow-hidden",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};