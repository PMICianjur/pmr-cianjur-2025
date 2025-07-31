import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

// Definisikan kuota total tenda di satu tempat agar mudah dikelola
const TENT_QUOTAS = {
    15: 10,
    20: 15,
    50: 5,
};

// Fungsi async untuk mengambil semua data yang dibutuhkan oleh halaman ini
async function getAkomodasiData() {
    const rentedTents = await prisma.registration.findMany({
        where: {
            tentType: 'SEWA_PANITIA',
            payment: { status: 'SUCCESS' }
        },
        select: {
            id: true,
            tentCapacity: true,
            kavlingNumber: true,
            school: { select: { name: true } }
        },
        orderBy: { kavlingNumber: 'asc' }
    });

    const rentedCounts: Record<number, number> = { 15: 0, 20: 0, 50: 0 };
    rentedTents.forEach(reg => {
        if (reg.tentCapacity && rentedCounts.hasOwnProperty(reg.tentCapacity)) {
            rentedCounts[reg.tentCapacity]++;
        }
    });

    const kavlingMap = new Map<string, { schoolName: string; registrationId: number }>();
    rentedTents.forEach(kavling => {
        if (kavling.kavlingNumber && kavling.tentCapacity) {
            const key = `${kavling.tentCapacity}-${kavling.kavlingNumber}`;
            kavlingMap.set(key, { schoolName: kavling.school.name, registrationId: kavling.id });
        }
    });

    return { rentedTents, rentedCounts, kavlingMap };
}

const kavlingZones = [
  { capacity: 15, title: "Zona A (Kapasitas 15)", range: [1, 20] },
  { capacity: 20, title: "Zona B (Kapasitas 20)", range: [21, 40] },
  { capacity: 50, title: "Zona C (Kapasitas 50)", range: [41, 60] },
];

export default async function AkomodasiPage() {
    const { rentedTents, rentedCounts, kavlingMap } = await getAkomodasiData();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Akomodasi</h1>
                <p className="text-muted-foreground">Ringkasan, daftar pemesan, dan visualisasi denah kavling perkemahan.</p>
            </div>

            {/* Kartu Statistik Ketersediaan Tenda */}
            <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(TENT_QUOTAS).map(([capacity, quota]) => {
                    const parsedCapacity = parseInt(capacity);
                    const rented = rentedCounts[parsedCapacity] || 0;
                    const available = quota - rented;
                    return (
                        <Card key={capacity} className="border-neutral-800 bg-pmi-red">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Tenda Kapasitas {capacity}</CardTitle>
                                <Users className="h-4 w-4 text-white" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{available} <span className="text-sm font-normal text-muted-foreground">/ {quota} Tersedia</span></div>
                                <p className="text-xs text-muted-foreground text-white">{rented} unit telah disewa</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tabel Daftar Pemesan Tenda */}
            <Card className="border-neutral-800 text-white bg-pmi-red">
                <CardHeader>
                    <CardTitle>Daftar Pemesan Tenda</CardTitle>
                    <CardDescription>Daftar kontingen yang menyewa tenda dari panitia.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg border-neutral-700">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-neutral-800  text-white hover:bg-transparent">
                                    <TableHead className="text-center">Nama Sekolah</TableHead>
                                    <TableHead className="text-center">Kapasitas Tenda</TableHead>
                                    <TableHead className="text-center">Nomor Kavling</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                                {rentedTents.length > 0 ? (
                                    rentedTents.map((reg) => (
                                        <TableRow key={reg.id} className="border-neutral-800">
                                            <TableCell className="font-medium text-black">
                                                <Link href={`/pendaftar/${reg.id}`} className="text-black">
                                                    {reg.school.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-black">
                                                <Badge variant="secondary">{reg.tentCapacity} Orang</Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-black">
                                                {reg.kavlingNumber} 
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="border-neutral-800">
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            Belum ada kontingen yang menyewa tenda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            {/* --- BAGIAN PETA KAVLING YANG HILANG --- */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold tracking-tight">Peta Denah Kavling</h2>
                {kavlingZones.map(zone => (
                    <Card key={zone.capacity} className="border-neutral-800 text-white bg-pmi-red">
                        <CardHeader>
                            <CardTitle>{zone.title}</CardTitle>
                            <CardDescription>Nomor Kavling {zone.range[0]} - {zone.range[1]}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TooltipProvider delayDuration={100}>
                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                                {Array.from({ length: zone.range[1] - zone.range[0] + 1 }, (_, i) => zone.range[0] + i).map(num => {
                                    const booking = kavlingMap.get(`${zone.capacity}-${num}`);
                                    const KavlingComponent = booking ? Link : 'div';
                                    return (
                                        <Tooltip key={num}>
                                            <TooltipTrigger asChild>
                                                <KavlingComponent
                                                    href={booking ? `/pendaftar/${booking.registrationId}` : '#'}
                                                    className={`flex items-center justify-center aspect-square w-full rounded-md text-sm font-bold font-sans transition-all duration-200
                                                      ${booking 
                                                          ? 'bg-green-600 text-white shadow-lg cursor-pointer hover:scale-110 hover:z-10' 
                                                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                                      }
                                                  `}
                                                >
                                                    {num}
                                                </KavlingComponent>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-sans bg-black p-1 rounded-md text-white">
                                                    {booking 
                                                        ? `Dipesan oleh: ${booking.schoolName}` 
                                                        : `Kavling #${num} - Tersedia`
                                                    }
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                          </TooltipProvider>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}