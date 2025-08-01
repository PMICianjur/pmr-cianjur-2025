/** @type {import('next').NextConfig} */
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
        // --- TEMPELKAN HOSTNAME ANDA PERSIS DI SINI ---
        hostname: 'dwhzkbncnypcksqlvfmp.supabase.co', 
        // ---------------------------------------------
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;

