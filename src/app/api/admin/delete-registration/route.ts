// src/app/api/admin/delete-registration/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId } = body;

    if (!registrationId || typeof registrationId !== 'number') {
      return NextResponse.json({ message: "ID Pendaftaran tidak valid." }, { status: 400 });
    }

    // Variabel untuk menyimpan ID sekolah
    let schoolIdToDelete: number | null = null;

    await prisma.$transaction(async (tx) => {
        // 1. Dapatkan data registrasi yang lengkap, TERMASUK schoolId
        const registrationToDelete = await tx.registration.findUnique({
            where: { id: registrationId },
            select: { 
                schoolId: true, // <-- PENTING: Ambil schoolId
                kavlingNumber: true, 
                tentCapacity: true, 
                school: { select: { category: true } } 
            }
        });

        if (!registrationToDelete) {
            throw new Error("Pendaftaran tidak ditemukan.");
        }
        
        // Simpan schoolId untuk digunakan nanti
        schoolIdToDelete = registrationToDelete.schoolId;

        // 2. Jika memesan kavling, reset kavling tersebut
        if (registrationToDelete.kavlingNumber && registrationToDelete.tentCapacity && registrationToDelete.school) {
            await tx.kavlingBooking.update({
                where: {
                    kavlingNumber_capacity_category: {
                        kavlingNumber: registrationToDelete.kavlingNumber,
                        capacity: registrationToDelete.tentCapacity,
                        category: registrationToDelete.school.category
                    }
                },
                data: {
                    isBooked: false,
                    registrationId: null
                }
            });
        }
        
        // 3. Hapus data Registration.
        // Ini akan meng-cascade dan menghapus Participant, Companion, dan Payment.
        await tx.registration.delete({
            where: { id: registrationId }
        });

        // 4. Setelah registrasi dihapus, cek apakah masih ada registrasi lain untuk sekolah ini
        if (schoolIdToDelete) {
            const remainingRegistrations = await tx.registration.count({
                where: { schoolId: schoolIdToDelete }
            });

            // Jika tidak ada lagi registrasi yang terhubung (count is 0), hapus sekolahnya
            if (remainingRegistrations === 0) {
                console.log(`No remaining registrations for schoolId: ${schoolIdToDelete}. Deleting school.`);
                await tx.school.delete({
                    where: { id: schoolIdToDelete }
                });
            } else {
                 console.log(`${remainingRegistrations} registrations still exist for schoolId: ${schoolIdToDelete}. Keeping school.`);
            }
        }
    });

    // TODO: Hapus folder file permanen terkait pendaftaran ini.

    return NextResponse.json({ message: "Pendaftaran dan data sekolah terkait (jika perlu) berhasil dihapus." });

  } catch (error: unknown) { // <-- Gunakan 'unknown'
    console.error("Error deleting registration:", error);
    let errorMessage = "Gagal menghapus pendaftaran.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
}
}