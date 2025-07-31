// src/app/kwitansi/layout.tsx
import "@/app/globals.css"; // Impor CSS global dengan cara Next.js

// Layout ini akan membungkus semua halaman di dalam /kwitansi/...
export default function KwitansiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kita hanya merender children tanpa elemen pembungkus tambahan
  // agar tidak mengganggu layout cetak
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}