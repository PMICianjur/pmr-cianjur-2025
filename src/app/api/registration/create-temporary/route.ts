import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client"; // 1. Impor Prisma

// 2. Definisikan skema Zod untuk validasi body yang masuk
const createTemporarySchema = z.object({
  schoolName: z.string().min(5),
  coachName: z.string().min(3),
  whatsappNumber: z.string().min(10),
  category: z.enum(["WIRA", "MADYA"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 3. Validasi body menggunakan Zod
    const validation = createTemporarySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: "Input tidak valid.", 
        errors: validation.error.flatten() 
      }, { status: 400 });
    }
    
    const tempRegistration = await prisma.temporaryRegistration.create({
        data: {
            // 4. Gunakan tipe Prisma.InputJsonValue
            data: validation.data as Prisma.InputJsonValue,
            step: 1,
            status: 'PENDING'
        }
    });

    return NextResponse.json({ 
        message: "Sesi pendaftaran berhasil dibuat.",
        tempRegId: tempRegistration.id
    }, { status: 201 });

  } catch (error) { // 5. Perbaiki blok catch
    console.error("Error creating temporary registration:", error);
    
    let errorMessage = "Terjadi kesalahan pada server.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}