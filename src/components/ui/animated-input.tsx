"use client";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

// Definisikan props kustom kita secara eksplisit
interface CustomAnimatedInputProps {
  placeholders: string[];
  formFieldName: string;
  icon?: ReactNode;
}

// Gabungkan props kustom dengan props input standar
type AnimatedInputProps = CustomAnimatedInputProps & React.InputHTMLAttributes<HTMLInputElement>;

export function AnimatedInput({ 
  // Destructuring semua props kustom
  placeholders, 
  formFieldName, 
  icon, 
  // Sisanya adalah props input standar
  ...props 
}: AnimatedInputProps) {
  const { register, watch } = useFormContext();
  const value = watch(formFieldName);
  const isTyping = value?.length > 0;

  const animations = {
    initial: { y: 0, opacity: 1 },
    animate: { y: -20, opacity: 0, transition: { duration: 0.3 } },
    exit: { y: 20, opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <AnimatePresence mode="wait">
        {!isTyping && (
          <motion.p
            key="placeholder"
            variants={animations}
            initial="initial"
            animate="initial"
            exit="animate"
            className={cn("absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none", { "left-3": !icon })}
          >
            {placeholders[0]}
          </motion.p>
        )}
      </AnimatePresence>
      <input
        {...register(formFieldName)}
        {...props} // Sekarang `...props` hanya berisi props input standar (e.g., type, onKeyDown)
        className={cn(
          "w-full h-12 bg-transparent text-lg text-pmi-dark border-b-2 border-gray-300 focus:border-pmi-red transition-colors duration-300 outline-none !ring-0 !ring-offset-0",
          { "pl-10": icon }
        )}
        autoComplete="off"
      />
    </div>
  );
}