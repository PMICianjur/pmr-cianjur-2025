"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { PaymentStatus } from "@prisma/client";

// Tipe data yang diterima oleh komponen ini, diimpor dari page.tsx
type RecentRegistration = {
    id: number;
    school: { name: string };
    payment: { status: PaymentStatus | null; amount: number } | null;
};

interface RecentRegistrationsTableProps {
    recentRegistrations: RecentRegistration[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(amount);
};

const getStatusBadgeVariant = (status?: PaymentStatus | null) => {
    if (!status) return 'outline';
    switch (status) {
        case 'SUCCESS': return 'success';
        case 'WAITING_CONFIRMATION': return 'warning';
        default: return 'secondary';
    }
};

export function RecentRegistrationsTable({ recentRegistrations }: RecentRegistrationsTableProps) {
    return (
        <Card className="h-full border-neutral-800 bg-pmi-red">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2 text-white">
                    <CardTitle>Pendaftar Terbaru</CardTitle>
                    <CardDescription>5 pendaftaran terakhir yang masuk.</CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1 text-white hover:bg-white hover:text-pmi-red" variant="outline">
                    <Link href="/pendaftar">
                        Lihat Semua
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-neutral-800 hover:bg-transparent">
                            <TableHead className="text-white">Sekolah</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-right text-white">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentRegistrations.length > 0 ? (
                            recentRegistrations.map(reg => (
                                <TableRow key={reg.id} className="border-neutral-800">
                                    <TableCell>
                                        <div className="font-medium text-white">{reg.school.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(reg.payment?.status)}>
                                            {reg.payment?.status?.replace('_', ' ') || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-white">
                                        {formatCurrency(reg.payment?.amount || 0)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-white">
                                    Belum ada pendaftar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}