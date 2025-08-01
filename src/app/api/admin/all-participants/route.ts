import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, SchoolCategory } from "@prisma/client"; // 1. Impor Prisma

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') as SchoolCategory | null;

        // 2. Gunakan tipe yang benar, bukan `any`
        const whereClause: Prisma.ParticipantWhereInput = {
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

        const participants = await prisma.participant.findMany({
            where: whereClause,
            include: {
                registration: {
                    include: {
                        school: {
                            select: {
                                name: true,
                                category: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                registration: {
                    createdAt: 'asc'
                }
            }
        });

        // Format data sebelum dikirim, `photoFilename` sudah menjadi URL
        const formattedData = participants.map((p, index) => ({
            no: index + 1,
            schoolName: p.registration.school.name,
            category: p.registration.school.category,
            fullName: p.fullName,
            photoUrl: p.photoFilename, // Langsung gunakan URL dari database
            birthPlaceDate: p.birthPlaceDate,
            address: p.address,
            religion: p.religion,
            bloodType: p.bloodType,
            entryYear: p.entryYear,
            phoneNumber: p.phoneNumber,
            gender: p.gender,
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