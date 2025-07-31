import type { NextConfig } from "next";

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
}

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'https://dwhzkbncnypcksqlvfmp.supabase.co', // Ganti dengan domain Vercel Anda
                port: '',
                pathname: '/storage/v1/object/public/**', // Izinkan semua path di bawah /uploads/
            },
            // Jika Anda menggunakan Supabase Storage, tambahkan hostname-nya di sini
            // {
            //     protocol: 'https',
            //     hostname: '<your-project-ref>.supabase.co',
            //     port: '',
            //     pathname: '/storage/v1/object/public/**',
            // }
        ],
    },
};
export default nextConfig;
