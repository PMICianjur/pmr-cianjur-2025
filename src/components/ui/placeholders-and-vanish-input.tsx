"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useRef, useCallback } from "react";

// --- SOLUSI #1: Definisikan tipe untuk partikel ---
interface Dot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
}

export const PlaceholdersAndVanishInput = ({
  placeholders,
  onChange,
  value,
  name,
  type,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  type?: string;
}) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [animating, setAnimating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Gunakan tipe Dot yang baru
  const newDataRef = useRef<Dot[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isFocused && (!value || value.length === 0)) {
      let interval: NodeJS.Timeout;
      const startAnimation = () => {
        interval = setInterval(() => {
          setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        }, 2000);
      };
      startAnimation();
      return () => clearInterval(interval);
    }
  }, [placeholders, isFocused, value]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);

    // Gunakan tipe Dot
    const newArr: Dot[] = [];
    // --- SOLUSI #2: Gunakan `const` karena `dots` tidak diubah ---
    const dots = newDataRef.current;

    // Beri tipe eksplisit pada parameter 'dot'
    dots.forEach((dot: Dot) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      dot.vx *= 0.95;
      dot.vy *= 0.95;
      dot.alpha -= 0.01;

      if (dot.alpha > 0) {
        newArr.push(dot);
        ctx.fillStyle = `rgba(220, 38, 38, ${dot.alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    newDataRef.current = newArr;

    if (newArr.length > 0) {
      animationFrameRef.current = window.requestAnimationFrame(draw);
    } else {
      setAnimating(false);
    }
  }, []);

  useEffect(() => {
    if (animating) {
      animationFrameRef.current = window.requestAnimationFrame(draw);
    }
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animating, draw]);

  const vanishAndSubmit = () => {
    setAnimating(true);
    const currentValue = inputRef.current?.value || "";

    if (currentValue && inputRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.font = "30px Lora";
        const textWidth = ctx.measureText(currentValue).width;
        const textX = (canvas.width / 2) - (textWidth / 2);
        const textY = (canvas.height / 2);

        // Gunakan tipe Dot
        const newDots: Dot[] = [];
        for(let i = 0; i < currentValue.length; i++) {
            const char = currentValue[i];
            const charWidth = ctx.measureText(char).width;
            const x = textX + ctx.measureText(currentValue.substring(0, i)).width + (charWidth / 2);
            for (let j = 0; j < 20; j++) {
                 newDots.push({
                    x: x,
                    y: textY,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: Math.random() * 2 + 1,
                    alpha: 1,
                });
            }
        }
        newDataRef.current = newDots;
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value && value.length > 0) {
        e.preventDefault(); 
        vanishAndSubmit();
        // --- PERBAIKAN PADA CASTING EVENT ---
        // Kita tidak perlu membuat objek event baru. Cukup panggil onChange dengan event yang dimodifikasi.
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target as HTMLInputElement,
                value: "",
                name: name || "",
            },
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };


  return (
    <div
      className="group w-full relative max-w-xl mx-auto bg-transparent h-14 transition-all duration-300 border-b-2 border-gray-300 focus-within:border-pmi-red"
    >
      <canvas
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none",
          animating ? "opacity-100" : "opacity-0",
          "transition-opacity duration-300"
        )}
        ref={canvasRef}
      />
      <input
        onChange={onChange}
        onKeyDown={handleKeyDown}
        value={value}
        name={name}
        type={type || "text"}
        ref={inputRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full relative text-base z-50 border-none bg-transparent text-pmi-dark h-full focus:outline-none focus:ring-0 px-2 font-sans",
          animating && "text-transparent"
        )}
      />

      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
        <AnimatePresence mode="wait">
          {(!value || value.length === 0) && !isFocused && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ duration: 0.2, ease: "linear" }}
              className="w-full absolute text-base text-left text-gray-400 px-2 font-sans"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};