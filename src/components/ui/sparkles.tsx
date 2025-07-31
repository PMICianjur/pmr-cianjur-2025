"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Menggunakan cn dari lib/utils

interface SparklesCoreProps {
  id: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  className?: string;
}

export const SparklesCore = ({
  id,
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  particleDensity = 100,
  particleColor = "#EF4444",
  className,
}: SparklesCoreProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speedX: number;
    speedY: number;
  }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      const numParticles = Math.floor(particleDensity * 100);

      for (let i = 0; i < numParticles; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (maxSize - minSize) + minSize,
          opacity: Math.random() * 0.5 + 0.1,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, [minSize, maxSize, particleDensity]);

  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let newX = p.x + p.speedX;
          let newY = p.y + p.speedY;

          // Reset particle position jika keluar layar
          if (newX < 0 || newX > 100) newX = Math.random() * 100;
          if (newY < 0 || newY > 100) newY = Math.random() * 100;

          return {
            ...p,
            x: newX,
            y: newY,
          };
        })
      );
      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background }}
    >
      {particles.map((particle) => (
        <motion.div
          key={`${id}-${particle.id}`}
          className="absolute rounded-full"
          animate={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            opacity: particle.opacity,
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particleColor,
          }}
        />
      ))}
    </div>
  );
};