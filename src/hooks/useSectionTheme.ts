"use client";

import { useState, useEffect, useMemo } from 'react';

// Definisikan tipe untuk parameter hook kita
type ThemeThreshold = {
  el: string; // Selektor CSS untuk elemen seksi, e.g., '#hero'
  theme: 'light' | 'dark';
};

/**
 * Custom hook untuk mendeteksi tema (terang/gelap) berdasarkan seksi yang sedang aktif di viewport.
 * @param thresholds Array objek yang mendefinisikan seksi dan tema yang sesuai.
 * @param defaultTheme Tema default yang akan digunakan.
 * @returns Tema yang sedang aktif ('light' atau 'dark').
 */
export const useSectionTheme = (
  thresholds: ThemeThreshold[],
  defaultTheme: 'light' | 'dark' = 'light'
) => {
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(defaultTheme);

  // useMemo untuk memastikan thresholds tidak menyebabkan re-render yang tidak perlu
  const memoizedThresholds = useMemo(() => thresholds, [thresholds]);

  useEffect(() => {
    // IntersectionObserver adalah API browser modern untuk mendeteksi visibilitas elemen.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Temukan tema yang sesuai dengan elemen yang sedang beririsan dengan viewport
            const newTheme = memoizedThresholds.find(
              (t) => `#${entry.target.id}` === t.el
            )?.theme;

            if (newTheme) {
              setActiveTheme(newTheme);
            }
          }
        });
      },
      {
        // rootMargin: '-50% 0px -50% 0px' akan memicu observer saat
        // bagian tengah elemen melewati bagian tengah viewport.
        // Ini memastikan transisi tema terjadi pada waktu yang tepat.
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    // Mulai mengamati setiap elemen yang didefinisikan di thresholds
    const elements = memoizedThresholds.map(t => document.querySelector(t.el)).filter(Boolean);
    elements.forEach((el) => {
      if(el) observer.observe(el);
    });

    // Fungsi cleanup: berhenti mengamati saat komponen di-unmount
    return () => {
      elements.forEach((el) => {
        if(el) observer.disconnect();
      });
    };
  }, [memoizedThresholds]); // Jalankan efek ini hanya jika thresholds berubah

  return activeTheme;
};