import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Gunakan tipe React standar yang lebih fundamental.
// Ini adalah tipe yang sama yang digunakan oleh 'Input' dari shadcn/ui di belakang layar.
export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(({ className, label, id, icon, value, onFocus, onBlur, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  // Logika untuk label "mengambang" disederhanakan.
  // Label mengambang jika input sedang fokus ATAU jika input memiliki nilai.
  // Ini lebih andal karena langsung bergantung pada prop `value`.
  const isLabelFloating = isFocused || (value != null && value !== "");

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Jalankan onFocus dari props jika ada
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // Jalankan onBlur dari props jika ada
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence>
        {/*
          Label sekarang menggunakan `htmlFor` yang terhubung ke `id` input.
          Ini penting untuk aksesibilitas.
        */}
        <motion.label
          htmlFor={id}
          className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 cursor-text pointer-events-none origin-left"
          initial={false}
          animate={{
            y: isLabelFloating ? "-1.75rem" : "-50%", // Gunakan rem untuk konsistensi
            scale: isLabelFloating ? 0.85 : 1,
            color: isLabelFloating ? "#dc2626" : "#6b7280", // PMI Red when floating
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.2 }}
        >
          {label}
        </motion.label>
      </AnimatePresence>
      
      {/* Wrapper untuk ikon agar tetap di posisi yang benar */}
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10">
           {icon}
        </div>
      )}

      <Input
        id={id}
        ref={ref}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="h-14 pl-12 text-base bg-transparent border-gray-300 focus:border-pmi-red focus-visible:ring-1 focus-visible:ring-pmi-red focus-visible:ring-offset-0"
        {...props}
      />
    </div>
  );
});

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };