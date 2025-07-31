// src/components/receipt/DownloadReceiptButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { type ReceiptData } from "@/types/receipt";

export default function DownloadReceiptButton({ data, orderId }: { data: ReceiptData, orderId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadReceipt = async () => {
    // Cari elemen kwitansi yang akan di-print dari DOM
    const receiptElement = document.getElementById('receipt-to-print');
    
    if (!receiptElement) {
        toast.error("Gagal memulai unduhan", { description: "Elemen kwitansi tidak dapat ditemukan." });
        return;
    }

    setIsGenerating(true);
    toast.info("Mempersiapkan kwitansi...", { duration: 10000 }); // Toast akan hilang setelah 10 detik

    try {
        // Gunakan html2canvas untuk 'mengambil screenshot' elemen
        const canvas = await html2canvas(receiptElement, { 
            scale: 2, // Meningkatkan resolusi gambar untuk kualitas yang lebih baik
            useCORS: true, // Diperlukan jika ada gambar dari sumber eksternal
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Inisialisasi jsPDF dengan format A4 potret
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Tambahkan gambar ke PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Buat nama file yang deskriptif
        // Simpan PDF
         pdf.save(`kwitansi-${data.schoolData.name.replace(/\s+/g, '-')}-${orderId.split('-')[0]}.pdf`);

        toast.success("Kwitansi berhasil diunduh!");

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Gagal membuat PDF", { description: "Terjadi kesalahan saat membuat file kwitansi." });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownloadReceipt} disabled={isGenerating}>
        {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Download className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? 'Membuat PDF...' : 'Unduh Kwitansi'}
    </Button>
  );
}