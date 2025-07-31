// Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <section className="gsap-section w-full h-screen bg-pmi-dark text-white flex flex-col items-center justify-center text-center p-8" data-theme="dark">
        <h2 className="text-6xl md:text-9xl font-extrabold tracking-tighter">
            Jadilah Bagian<br/>Dari Kami.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-gray-400">
            Pendaftaran untuk Pelatihan dan Pelantikan PMR 2025 telah dibuka. Ambil langkah pertamamu dalam perjalanan kemanusiaan ini.
        </p>
        <Link href="/pendaftaran" className="mt-12">
            <div className="group relative inline-block text-lg font-semibold">
                <span className="relative z-10 block px-12 py-4 bg-white text-pmi-red transition-transform duration-300 ease-in-out group-hover:-translate-x-2 group-hover:-translate-y-2">
                    DAFTAR SEKARANG
                </span>
                <span className="absolute top-0 left-0 h-full w-full border-2 border-white"></span>
            </div>
        </Link>
         <p className="mt-10">
            <Link href="/login" className="text-gray-400 bg-transparent border-2 border-gray-400 px-2 py-1 rounded-md hover:text-white hover:bg-pmi-red transition-colors">
                Admin Access
            </Link>
        </p>
    </section>
  );
}