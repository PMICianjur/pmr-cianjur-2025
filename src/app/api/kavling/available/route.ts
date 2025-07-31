// /api/kavling/available/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SchoolCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
    // Ambil parameter 'category' dari URL
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as SchoolCategory | null;

    if (!category || !Object.values(SchoolCategory).includes(category)) {
        return NextResponse.json({ message: "Parameter 'category' (WIRA/MADYA) dibutuhkan." }, { status: 400 });
    }

    try {
        const availableKavlings = await prisma.kavlingBooking.findMany({
            where: { 
                isBooked: false,
                category: category, // <-- Filter berdasarkan kategori
            },
            select: {
                kavlingNumber: true,
                capacity: true,
            },
            orderBy: {
                kavlingNumber: 'asc',
            }
        });
        
        const grouped = availableKavlings.reduce((acc, kavling) => {
            const { capacity, kavlingNumber } = kavling;
            if (!acc[capacity]) {
                acc[capacity] = [];
            }
            acc[capacity].push(kavlingNumber);
            return acc;
        }, {} as Record<number, number[]>);

        return NextResponse.json(grouped);

    } catch (error) {
        console.error("Error fetching available kavlings:", error);
        return NextResponse.json({ message: "Gagal mengambil data kavling" }, { status: 500 });
    }
}