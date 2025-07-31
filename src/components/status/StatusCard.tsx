// src/components/status/StatusCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DownloadReceiptButton from "@/components/receipt/DownloadReceiptButton";
import { type ReceiptData } from "@/types/receipt";
import Link from "next/link"

interface StatusConfig {
    Icon: React.ElementType;
    color: string;
    title: string;
    message: string;
}

interface StatusCardProps {
  statusConfig: StatusConfig;
    orderId: string;
  receiptData: ReceiptData | null;
}

export function StatusCard({ statusConfig, orderId, receiptData }: StatusCardProps) {
    const { Icon, color, title, message } = statusConfig;
  return (
        <Card>
            <CardHeader>
                <Icon className={`w-16 h-16 mx-auto ${color}`} />
                <CardTitle className="mt-4">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm font-mono bg-muted p-2 rounded-md break-all">Order ID: {orderId}</p>
                
                <div className="flex justify-center gap-4">
                    {/* Tombol Unduh Kwitansi hanya muncul jika ada data kwitansi */}
                    {receiptData && (
                        <DownloadReceiptButton data={receiptData} orderId={orderId} />
                    )}
                    <Button asChild variant="outline">
                        <Link href="/">Kembali ke Beranda</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}