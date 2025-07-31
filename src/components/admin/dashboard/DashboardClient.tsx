"use client";

import { motion } from "framer-motion";
import { StatCard } from "./StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { RecentRegistrationsTable } from "./RecentRegistrationTable";
import { LoginHistoryCard } from "./LoginHistoryCard";
import { IconUsers, IconUserCheck, IconCash, IconHourglass } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// --- 1. IMPOR TIPE DARI SERVER COMPONENT ---
import { DashboardData } from "@/app/(admin)/dashboard/page";

// --- 2. GUNAKAN TIPE YANG SUDAH DIIMPOR ---
export function DashboardClientPage({ initialData }: { initialData: DashboardData }) {
    // Sekarang TypeScript tahu persis apa itu `initialData`
    const { stats, chartData, recentRegistrations, loginHistory } = initialData;

    // Mapping antara judul stat dan ikonnya. Ini dilakukan di sisi klien.
    const statIcons: { [key: string]: React.ElementType } = {
        "Pendaftar Lunas": IconUsers,
        "Total Peserta": IconUserCheck,
        "Pemasukan": IconCash,
        "Menunggu Konfirmasi": IconHourglass,
    };

    const statItems = [
        { title: "Pendaftar Lunas", value: stats.totalPendaftar, unit: "Sekolah" },
        { title: "Total Peserta", value: stats.totalPeserta, unit: "Orang" },
        { title: "Pemasukan", value: stats.totalPemasukan, isCurrency: true },
        { title: "Menunggu Konfirmasi", value: stats.menungguKonfirmasi, unit: "Pembayaran", special: true },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <Button asChild variant="outline">
                    <Link href="/pendaftar">Lihat Semua Pendaftar</Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((stat, index) => (
                    <StatCard 
                        key={stat.title} 
                        index={index} 
                        title={stat.title}
                        value={stat.value}
                        icon={statIcons[stat.title]}
                        unit={stat.unit}
                        isCurrency={stat.isCurrency}
                        special={stat.special}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3">
                     <Card className="h-full border-neutral-800 bg-white">
                        <CardHeader><CardTitle>Pertumbuhan Pemasukan</CardTitle><CardDescription>Akumulasi pendapatan.</CardDescription></CardHeader>
                        <CardContent className="pl-2"><RevenueChart data={chartData} /></CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <RecentRegistrationsTable recentRegistrations={recentRegistrations} />
                    <LoginHistoryCard history={loginHistory} /> 
                </div>
            </div>
        </motion.div>
    );
}