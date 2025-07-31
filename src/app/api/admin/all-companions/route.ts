import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SchoolCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') as SchoolCategory | null;

        // Tipe WhereClause yang lebih sederhana untuk query ini
        let schoolFilter = {};
        if (category && (category === 'WIRA' || category === 'MADYA')) {
            schoolFilter = {
                category: category
            };
        }

        const participants = await prisma.participant.findMany({
            where: {
                registration: {
                    payment: {
                        status: 'SUCCESS'
                    },
                    school: schoolFilter // Terapkan filter sekolah di sini
                },
            },
            include: {
                registration: {
                    include: {
                        school: {
                            select: {
                                name: true,
                                category: true,
                                normalizedName: true, // Gunakan ini untuk slug
                            }
                        }
                    }
                }
            },
            orderBy: [
                { registration: { createdAt: 'asc' } },
                { id: 'asc' }
            ]
        });
        
        const formattedData = participants.map((c, index) => {
            // Gunakan normalizedName yang sudah ada di DB untuk membuat slug
            return {
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
            };
        });

        return NextResponse.json(formattedData);

    } catch (error: unknown) { // Gunakan 'unknown' untuk tipe error yang aman
        let errorMessage = "Gagal mengambil data peserta.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error fetching all participants:", error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}