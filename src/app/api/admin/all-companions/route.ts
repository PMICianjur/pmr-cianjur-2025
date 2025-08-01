import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SchoolCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') as SchoolCategory | null;

        const whereClause: any = {
            payment: { status: 'SUCCESS' }
        };

        if (category) {
            whereClause.school = { category: category };
        }

        const companions = await prisma.companion.findMany({
            where: {
                registration: whereClause,
            },
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
    } catch (error: any) {
        console.error("Error fetching all companions:", error);
        return NextResponse.json({ message: "Gagal mengambil data pendamping." }, { status: 500 });
    }
}