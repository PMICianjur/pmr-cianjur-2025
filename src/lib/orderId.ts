// src/lib/orderId.ts
import prisma from "@/lib/prisma";

/**
 * Membuat Order ID yang unik, informatif, dan URL-safe.
 * Format: (nomorurut)-(NAMASEKOLAH)-(PelPMR)-(bulanmendaftar)-2025
 * @param schoolName Nama sekolah pendaftar.
 * @returns Sebuah string Order ID yang unik.
 */
export async function generateSafeOrderId(schoolName: string): Promise<string> {
    const registrationCount = await prisma.registration.count();
    const nextRegistrationNumber = registrationCount + 1;
    
    const date = new Date();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    // --- RANTAI SANITASI YANG DISEMPURNAKAN ---
    const safeSchoolName = schoolName
        .toUpperCase()                      // 1. Jadikan huruf besar
        .replace(/\s+/g, '-')             // 2. Ganti semua spasi dengan satu tanda hubung
        .replace(/[^A-Z0-9-]/g, '')       // 3. Hapus semua karakter yang BUKAN huruf kapital, angka, atau tanda hubung
        .replace(/-+/g, '-')              // 4. Ganti beberapa tanda hubung berurutan menjadi satu saja (mencegah --, ---, dst.)
        .replace(/^-|-$/g, '')            // 5. Hapus tanda hubung jika ada di awal atau akhir string
        .slice(0, 25);                    // 6. Potong hingga maksimal 25 karakter

    // 4. Gabungkan semua bagian menjadi satu Order ID
    const orderId = `${nextRegistrationNumber}-${safeSchoolName}-PelPMR-${month}-${year}`;

    return orderId;
}