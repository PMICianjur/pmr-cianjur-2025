"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { ManualPaymentDialog } from './ManualPaymentDialog';
import { motion } from "framer-motion";

// Helper untuk format mata uang
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function Step7_Payment() {
    const store = useRegistrationStore();
    const { prevStep, reset, ...registrationState } = store;
    const router = useRouter();
    
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [paymentMethod] = useState<'otomatis' | 'manual' | null>(null);

    const handleManualSuccess = (orderId: string) => {
        setIsManualDialogOpen(false);
        reset();
        router.push(`/success/${orderId}?manual=true`); 
    };

    return (
        <div className="font-serif space-y-12">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-pmi-dark">Langkah Final: Pembayaran</h2>
                <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
                    Selesaikan pendaftaran Anda dengan melakukan pembayaran sesuai total tagihan.
                </p>
            </div>

            {/* Kotak Konfirmasi Total Biaya */}
            <div className="p-6 bg-red-50 border-2 border-dashed border-pmi-red rounded-lg text-center">
                <p className="font-sans text-pmi-dark">Total Tagihan Akhir</p>
                <p className="text-5xl font-bold text-pmi-red tracking-tight mt-2">
                    {formatCurrency(registrationState.costs.total)}
                </p>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center text-pmi-dark">Pilih Metode Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        onClick={() => setIsManualDialogOpen(true)}
                        className={`p-8 border-2 rounded-lg cursor-pointer transition-all duration-300 relative ${
                            paymentMethod === 'manual' ? 'border-pmi-red bg-red-50' : 'border-gray-300 bg-white hover:border-pmi-dark'
                        }`}
                        whileHover={{ scale: 1.03 }}
                    >
                         <div className="flex items-center gap-4">
                            <Upload className="h-8 w-8 text-pmi-dark" />
                            <h4 className="text-2xl font-bold text-pmi-dark">Transfer Manual</h4>
                        </div>
                        <p className="mt-4 font-sans text-gray-600">
                            Transfer ke rekening panitia. Membutuhkan unggah bukti dan konfirmasi manual (maks. 1x24 jam).
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-start pt-8 border-t">
                <button type="button" onClick={prevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark">
                    Kembali ke Ringkasan
                </button>
            </div>

            {/* Dialog Pembayaran Manual */}
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