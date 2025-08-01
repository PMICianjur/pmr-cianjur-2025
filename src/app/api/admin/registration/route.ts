// src/app/api/admin/registrations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Ini adalah API yang akan dipanggil oleh PendaftarTableWrapper
export async function GET() {
    try {
        const registrations = await prisma.registration.findMany({
            include: {
                school: true,
                payment: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format data agar aman dan konsisten
        const formattedData = registrations.map(reg => ({
            id: reg.id,
            normalizedName: reg.school.normalizedName,
            category: reg.school.category,
            coachName: reg.school.coachName,
            whatsappNumber: reg.school.whatsappNumber,
            status: reg.payment?.status ?? 'PENDING',
            method: reg.payment?.method ?? 'UNKNOWN',
            totalFee: reg.totalFee,
            participantCount: reg.participantCount,
            companionCount: reg.companionCount,
            createdAt: reg.createdAt.toISOString(),
            paymentId: reg.payment?.id,
            manualProofPath: reg.payment?.manualProofPath,
            excelFilePath: reg.excelFilePath,
            receiptPath: reg.payment?.receiptPath
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Failed to fetch registrations:", error);
        return NextResponse.json({ message: "Gagal mengambil data pendaftar." }, { status: 500 });
    }
}