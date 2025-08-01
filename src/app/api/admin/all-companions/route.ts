import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, SchoolCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') as SchoolCategory | null;

        const whereClause: Prisma.CompanionWhereInput = {
            registration: {
                payment: {
                    status: 'SUCCESS'
                }
            }
        };

       if (category && (category === 'WIRA' || category === 'MADYA')) {
            whereClause.registration!.school = { // Gunakan '!' karena kita tahu `registration` sudah ada
                category: category
            };
        }

        const companions = await prisma.companion.findMany({
            where: whereClause,
            include: {
                registration: {
                    include: {
                        school: { select: { name: true, category: true } }
                    }
                }
            },
            orderBy: { registration: { createdAt: 'asc' } }
        });

        const formattedData = companions.map((c, index) => ({
            no: index + 1,
            schoolName: c.registration.school.name,
            category: c.registration.school.category,
            fullName: c.fullName,
            birthPlaceDate: c.birthPlaceDate,
            address: c.address,
            religion: c.religion,
            bloodType: c.bloodType,
            entryYear: c.entryYear,
            phoneNumber: c.phoneNumber,
            gender: c.gender,
        }));

        return NextResponse.json(formattedData);
    } catch (error: unknown) { // 1. Gunakan `unknown`
    let errorMessage = "Terjadi kesalahan pada server.";
    // 2. Lakukan type guard
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Error fetching data:", error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
}
}