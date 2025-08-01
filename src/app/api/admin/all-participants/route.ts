import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SchoolCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') as SchoolCategory | null;

        const whereClause: any = {
            payment: {
                status: 'SUCCESS'
            }
        };

        if (category && (category === 'WIRA' || category === 'MADYA')) {
            whereClause.school = {
                category: category
            };
        }

        const participants = await prisma.participant.findMany({
            where: {
                registration: whereClause,
            },
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

    } catch (error: any) {
        console.error("Error fetching all participants:", error);
        return NextResponse.json({ message: "Gagal mengambil data peserta." }, { status: 500 });
    }
}