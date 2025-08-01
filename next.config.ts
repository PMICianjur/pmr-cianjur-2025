import type { NextConfig } from "next";

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
}

const nextConfig = {
    images: {
        // Konfigurasi ini memberitahu Next.js dari domain mana saja ia boleh mengoptimalkan gambar.
        remotePatterns: [
            {
                // Izinkan gambar dari domain aplikasi Anda sendiri (jika ada)
                protocol: 'https',
                hostname: 'pmrcianjur.vercel.app', // Ganti dengan domain Vercel Anda
                port: '',
                pathname: '/uploads/**', 
            },
            {
                // --- TAMBAHKAN BLOK INI UNTUK SUPABASE ---
                protocol: 'https',
                hostname: 'dwhzkbncnypcksqlvfmp.supabase.co', // <-- GANTI DENGAN HOSTNAME SUPABASE ANDA
                port: '',
                pathname: '/storage/v1/object/public/**', // Izinkan semua path di bawah public storage
            }
        ],
    },
};

export default nextConfig;
