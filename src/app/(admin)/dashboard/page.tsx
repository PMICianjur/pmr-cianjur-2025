import prisma from "@/lib/prisma";
import { Suspense } from "react";
import { DashboardClientPage } from "@/components/admin/dashboard/DashboardClient"; // Memastikan nama impor konsisten
import { DashboardSkeleton } from "@/components/admin/dashboard/DashboardSkeleton";
import { PaymentStatus } from "@prisma/client";

// Tipe data yang akan kita teruskan ke komponen klien.
// Ini adalah "kontrak" antara Server Component dan Client Component.
export interface DashboardData {
    stats: {
        totalPendaftar: number;
        totalPeserta: number;
        totalPemasukan: number;
        menungguKonfirmasi: number;
        totalTendaSewa: number;
    };
    chartData: {
        date: string;
        "Total Pemasukan": number;
    }[];
    recentRegistrations: {
        id: number;
        createdAt: string; // Harus string (ISO format)
        school: { name: string };
        payment: {
            status: PaymentStatus; // Enum PaymentStatus
            amount: number;
        } | null;
    }[];
    loginHistory: {
        id: number;
        loginAt: string; // Harus string (ISO format)
        admin: { name: string; username: string; };
    }[];
}

// Fungsi asinkron untuk mengambil semua data dari database di server
async function getDashboardData(): Promise<DashboardData> {
    // Jalankan semua query secara paralel untuk performa maksimal
    const [
        successfulRegistrations, 
        waitingConfirmationCount, 
        recentRegistrationsData, 
        totalTendaSewa,
        loginHistoryData
    ] = await Promise.all([
        prisma.registration.findMany({ 
            where: { payment: { status: 'SUCCESS' } }, 
            include: { payment: true }, 
            orderBy: { createdAt: 'asc' } 
        }),
        prisma.registration.count({ 
            where: { payment: { status: 'WAITING_CONFIRMATION' } } 
        }),
        prisma.registration.findMany({ 
            take: 5, 
            orderBy: { createdAt: 'desc' }, 
            include: { 
                school: { select: { name: true } }, 
                payment: { select: { status: true, amount: true } } 
            } 
        }),
        prisma.registration.count({
            where: {
                tentType: 'SEWA_PANITIA',
                payment: { status: 'SUCCESS' }
            }
        }),
        prisma.loginHistory.findMany({
            take: 5,
            orderBy: { loginAt: 'desc' },
            include: { admin: { select: { name: true, username: true } } }
        })
    ]);

    // Proses data menjadi objek JSON yang bersih dan serializable
    const stats = {
        totalPendaftar: successfulRegistrations.length,
        totalPeserta: successfulRegistrations.reduce((sum, reg) => sum + reg.participantCount + reg.companionCount, 0),
        totalPemasukan: successfulRegistrations.reduce((sum, reg) => sum + (reg.payment?.amount || 0), 0),
        menungguKonfirmasi: waitingConfirmationCount,
        totalTendaSewa: totalTendaSewa,
    };

    let cumulativeRevenue = 0;
    const chartData = successfulRegistrations.map(reg => {
        cumulativeRevenue += reg.payment?.amount || 0;
        return {
            date: reg.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            "Total Pemasukan": cumulativeRevenue,
        };
    });

    // Format data agar aman diteruskan ke Client Component (mengubah Date menjadi string)
    const formattedRecentRegistrations = recentRegistrationsData.map(reg => ({
        id: reg.id,
        createdAt: reg.createdAt.toISOString(),
        school: reg.school,
        // Pastikan objek payment juga aman
        payment: reg.payment ? {
            status: reg.payment.status,
            amount: reg.payment.amount,
        } : null,
    }));

    const formattedLoginHistory = loginHistoryData.map(entry => ({
        id: entry.id,
        loginAt: entry.loginAt.toISOString(),
        admin: entry.admin,
    }));

    return {
        stats,
        chartData,
        recentRegistrations: formattedRecentRegistrations,
        loginHistory: formattedLoginHistory,
    };
}

export default async function DashboardPage() {
    // Ambil data di server
    const data = await getDashboardData();

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            {/* Render Client Component dan teruskan semua data sebagai satu prop */}
            <DashboardClientPage initialData={data} />
        </Suspense>
    );
}