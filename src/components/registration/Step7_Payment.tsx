"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ManualPaymentDialog } from './ManualPaymentDialog'; // Impor komponen dialog

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function Step7_Payment() {
    const store = useRegistrationStore();
    const { prevStep, reset, ...registrationState } = store;
    const router = useRouter();
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

    // Fungsi ini akan dipanggil oleh dialog setelah upload berhasil
    const handleManualSuccess = (orderId: string) => {
        setIsManualDialogOpen(false); // Tutup dialog
        reset(); // Kosongkan state dan localStorage untuk pendaftar berikutnya
        // Redirect ke halaman sukses dengan parameter untuk menampilkan pesan khusus
        router.push(`/success/${orderId}?manual=true`); 
    };

    return (
        <div className="font-serif space-y-8">
             <div className="text-center">
                <h2 className="text-3xl font-bold text-pmi-dark">Langkah Terakhir: Pembayaran</h2>
                <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
                Selesaikan pendaftaran Anda dengan melakukan transfer manual dan mengunggah bukti pembayaran.
                </p>
            </div>
            
            {/* Kartu Instruksi Pembayaran */}
            <div className="p-8 border-2 border-dashed rounded-lg bg-gray-50 text-center space-y-6">
                <div>
                    <p className="font-sans text-gray-600">Total yang harus dibayar:</p>
                    <p className="text-4xl font-bold text-pmi-red my-2">
                        {formatCurrency(registrationState.costs.total)}
                    </p>
                </div>
                <div>
                    <p className="font-sans text-gray-600">Silakan transfer ke rekening berikut:</p>
                    <div className="mt-2 p-4 bg-white border rounded-md inline-block">
                        <p className="font-semibold text-pmi-dark">Bank BCA</p>
                        <p className="text-xl font-bold tracking-wider my-1">1234 5678 9012</p>
                        <p>a.n. Panitia PMR Cianjur</p>
                    </div>
                </div>
                <p className="font-sans text-sm text-gray-500 max-w-md mx-auto">
                    Setelah melakukan transfer, klik tombol di bawah ini untuk mengunggah bukti pembayaran Anda. Pendaftaran Anda akan diproses setelah dikonfirmasi oleh panitia.
                </p>
            </div>
            
            <div className="flex justify-between items-center pt-8 border-t">
                <button type="button" onClick={prevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark">
                    Kembali ke Ringkasan
                </button>
                <Button 
                    onClick={() => setIsManualDialogOpen(true)}
                    className="group"
                    size="lg"
                >
                    <span className="relative flex items-center gap-2">
                        Unggah Bukti & Selesaikan
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                </Button>
            </div>

            {/* Render Dialog Pembayaran Manual */}
            <ManualPaymentDialog 
                isOpen={isManualDialogOpen}
                onClose={() => setIsManualDialogOpen(false)}
                onSuccess={handleManualSuccess}
                registrationData={registrationState}
                totalAmount={registrationState.costs.total}
            />
        </div>
    );
}