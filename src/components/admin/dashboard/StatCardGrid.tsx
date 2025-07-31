import prisma from "@/lib/prisma";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { IconUsers, IconUserCheck, IconCash, IconHourglass } from "@tabler/icons-react";

// Komponen Server Asinkron untuk mengambil data
export default async function StatCardGrid() {
    // Jalankan semua query secara paralel untuk efisiensi
    const [registrations, waitingConfirmationCount] = await Promise.all([
        prisma.registration.findMany({
            where: { payment: { status: 'SUCCESS' } },
            include: { payment: true }
        }),
        prisma.registration.count({
            where: { payment: { status: 'WAITING_CONFIRMATION' } }
        })
    ]);
    
    const statsData = {
        totalPendaftar: registrations.length,
        totalPeserta: registrations.reduce((sum, reg) => sum + reg.participantCount + reg.companionCount, 0),
        totalPemasukan: registrations.reduce((sum, reg) => sum + (reg.payment?.amount || 0), 0),
        menungguKonfirmasi: waitingConfirmationCount,
    };
    
    const stats = [
        { title: "Pendaftar Lunas", value: statsData.totalPendaftar.toString(), icon: IconUsers, unit: "Sekolah" },
        { title: "Total Peserta", value: statsData.totalPeserta.toString(), icon: IconUserCheck, unit: "Orang" },
        { title: "Pemasukan", value: statsData.totalPemasukan, icon: IconCash, isCurrency: true },
        { title: "Menunggu Konfirmasi", value: statsData.menungguKonfirmasi.toString(), icon: IconHourglass, unit: "Pembayaran", special: true },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => <StatCard key={stat.title} index={index} {...stat} />)}
        </div>
    );
}

// Komponen Skeleton untuk ditampilkan selama data dimuat
export function StatCardGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[126px] rounded-xl bg-neutral-800/50 animate-pulse"></div>
            ))}
        </div>
    );
}