// src/app/api/tents/availability/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Definisikan kuota total untuk setiap kapasitas tenda
const TENT_QUOTAS = {
    15: 10, // Kapasitas 15 -> 10 tenda
    20: 15, // Kapasitas 20 -> 15 tenda
    50: 5,  // Kapasitas 50 -> 5 tenda
};

export async function GET() {
    try {
        // Hitung jumlah tenda yang sudah disewa untuk setiap kapasitas
        const rentedTents = await prisma.registration.groupBy({
            by: ['tentCapacity'],
            where: {
                tentType: 'SEWA_PANITIA',
                tentCapacity: {
                    in: [15, 20, 50], // Hanya hitung kapasitas yang relevan
                },
            },
            _count: {
                tentCapacity: true,
            },
        });

        // Ubah hasil query menjadi format yang lebih mudah digunakan: { kapasitas: jumlah_sewa }
        const rentedCounts = rentedTents.reduce((acc, group) => {
            if (group.tentCapacity) {
                acc[group.tentCapacity] = group._count.tentCapacity;
            }
            return acc;
        }, {} as Record<number, number>);

        // Hitung ketersediaan yang tersisa
        const availability = {
            15: TENT_QUOTAS[15] - (rentedCounts[15] || 0),
            20: TENT_QUOTAS[20] - (rentedCounts[20] || 0),
            50: TENT_QUOTAS[50] - (rentedCounts[50] || 0),
        };

        return NextResponse.json(availability);

    } catch (error) { // Hapus `: any`
    console.error("Error fetching tent availability:", error);

    let errorMessage = "Gagal mengambil data ketersediaan tenda.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json(
        { message: errorMessage },
        { status: 500 }
    );
}
}