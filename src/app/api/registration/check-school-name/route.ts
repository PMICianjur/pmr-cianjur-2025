// src/app/api/registration/check-school-name/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeSchoolName } from "@/lib/normalization";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schoolName } = body;

    if (!schoolName || typeof schoolName !== 'string' || schoolName.length < 3) {
      // Tidak melakukan pengecekan jika input terlalu pendek
      return NextResponse.json({ available: true, message: "Input valid." });
    }

    const normalizedName = normalizeSchoolName(schoolName);

    const existingSchool = await prisma.school.findUnique({
      where: { normalizedName },
    });

    if (existingSchool) {
      return NextResponse.json(
        { available: false, message: `Sekolah dengan nama ini sudah terdaftar.` },
        { status: 200 } // Gunakan 200 OK karena ini adalah hasil validasi, bukan error server
      );
    }

    return NextResponse.json({ available: true, message: "Nama sekolah tersedia." });

  } catch (error) {
    console.error("Error checking school name:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat memeriksa nama sekolah." },
      { status: 500 }
    );
  }
}