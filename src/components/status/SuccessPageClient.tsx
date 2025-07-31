"use client"; // Tandai sebagai Client Component

import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReceiptComponent from "@/components/receipt/ReceiptComponent";
import DownloadReceiptButton from "@/components/receipt/DownloadReceiptButton";
import { type ReceiptData } from "@/types/receipt";
import Link from "next/link"

// Tipe props yang diterima dari Server Component
interface SuccessPageClientProps {
  receiptData: ReceiptData | null;
  orderId: string;
  isFromManualPayment: boolean;
}

export function SuccessPageClient({ receiptData, orderId, isFromManualPayment }: SuccessPageClientProps) {
  return (
    <div className="container mx-auto max-w-2xl py-12 text-center">
      <Card className="bg-white">
        <CardHeader>
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <CardTitle className="mt-4 text-3xl font-serif">Pendaftaran Berhasil!</CardTitle>
          <CardDescription>
            {isFromManualPayment 
              ? "Bukti pembayaran Anda telah kami terima. Pendaftaran akan aktif setelah dikonfirmasi oleh panitia (maks. 1x24 jam)."
              : "Pembayaran Anda telah kami terima secara otomatis. Terima kasih telah mendaftar!"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm font-mono bg-muted p-2 rounded-md break-all">
            Order ID: {orderId}
          </p>
          
          <div className="flex justify-center gap-4">
            {receiptData ? (
              <DownloadReceiptButton data={receiptData} orderId={orderId} />
            ) : (
                 <p className="text-sm text-red-500">Gagal memuat data kwitansi.</p>
            )}
            <Button asChild variant="outline">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {receiptData && (
         <div id="receipt-to-print" className="absolute -left-[9999px] top-0 w-[210mm]">
            <ReceiptComponent data={receiptData} orderId={orderId} />
         </div>
      )}
    </div>
  );
}