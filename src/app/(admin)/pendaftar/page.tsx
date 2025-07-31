import prisma from "@/lib/prisma";
import { PendaftarTableWrapper } from "@/components/admin/PendaftarTableWrapper";
import { FormattedRegistration } from "@/types/admin"; // Pastikan path ini benar

// Fungsi async untuk mengambil semua data pendaftar yang dibutuhkan oleh tabel.
// Dijalankan di server.
async function getPendaftar(): Promise<FormattedRegistration[]> {
    const registrations = await prisma.registration.findMany({
        include: {
            school: {
                select: {
                    name: true,
                    normalizedName: true,
                    coachName: true,
                    whatsappNumber: true,
                    category: true,
                }
            },
            payment: {
                select: {
                    id: true,
                    status: true,
                    method: true,
                    manualProofPath: true,
                }
            },
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Format data agar aman dikirim ke Client Component.
    // Objek `Date` tidak bisa langsung diteruskan, jadi kita ubah ke string ISO.
    return registrations.map(reg => ({
        id: reg.id,
        normalizedName: reg.school.normalizedName,
        coachName: reg.school.coachName,
        category: reg.school.category,
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
    }));
}

export default async function PendaftarPage() {
    const data = await getPendaftar();
    
    // Render Client Component dan teruskan data yang sudah diambil
    return (
        <PendaftarTableWrapper data={data} />
    );
}