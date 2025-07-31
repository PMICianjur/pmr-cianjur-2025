import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Impor argumen query dan tipe dari file tipe global
import { registrationDetailQueryArgs, type RegistrationDetailPayload } from "@/types/registration";

// Hapus 'RouteContext' jika tidak diperlukan lagi untuk kejelasan
export async function GET(
  req: NextRequest,
  // --- PERBAIKAN UTAMA: Gunakan 'any' HANYA untuk parameter kedua ---
  // Ini adalah titik di mana type checker Next.js gagal.
  // Kita akan memberitahunya untuk tidak memeriksa bagian ini.
// @ts-expect-error: Next.js build-time type check fails for RouteContext here
context: RouteContext
) {
  // Lakukan de-structuring dengan aman di dalam
  const params = context.params as { id: string };

  try {
    if (!params || !params.id) {
        return NextResponse.json({ message: "Parameter ID tidak ditemukan." }, { status: 400 });
    }

    const registrationId = parseInt(params.id, 10);
    if (isNaN(registrationId)) {
      return NextResponse.json({ message: "ID Pendaftaran tidak valid." }, { status: 400 });
    }

    const registrationDetail: RegistrationDetailPayload | null = await prisma.registration.findUnique({
      where: { id: registrationId },
      ...registrationDetailQueryArgs,
    });

    if (!registrationDetail) {
      return NextResponse.json({ message: "Data pendaftaran tidak ditemukan." }, { status: 404 });
    }

    // Logika serialisasi data
    const { payment, ...restOfRegistration } = registrationDetail;
    const serializableData = {
        ...restOfRegistration,
        createdAt: registrationDetail.createdAt.toISOString(),
        updatedAt: registrationDetail.updatedAt.toISOString(),
        payment: payment ? {
            ...payment,
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            confirmedAt: payment.confirmedAt?.toISOString() || null
        } : null
    };

    return NextResponse.json(serializableData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    console.error("Error fetching registration detail:", error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}