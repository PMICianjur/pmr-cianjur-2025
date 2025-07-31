"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, School, Tent, ShieldCheck } from "lucide-react";

// Helper untuk memformat angka menjadi format mata uang Rupiah
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Komponen kecil untuk merender setiap baris data agar kode lebih rapi dan konsisten
function SummaryRow({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="flex justify-between items-baseline py-3 border-b border-gray-100">
            <dt className="font-sans text-sm text-gray-500">{label}</dt>
            <dd className="font-sans font-medium text-pmi-dark text-right">{value}</dd>
        </div>
    );
}

export default function Step6_Summary() {
  const { prevStep, nextStep, goToStep, ...state } = useRegistrationStore();
  
  // Lakukan de-structuring state dari store di awal
  const { schoolData, excelData, tentChoice, kavling, costs } = state;

  // --- Penjaga (Guard) #1: Memeriksa data dasar ---
  // Jika salah satu dari data ini belum ada, tampilkan pesan error dan berhenti.
  if (!schoolData || !excelData || !tentChoice) {
      return (
        <div className="text-center font-sans text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-pmi-dark">Data Belum Lengkap</h3>
            <p className="mt-2">Beberapa data dari langkah sebelumnya belum terisi. Harap kembali untuk melengkapi.</p>
            <button
                type="button"
                onClick={() => goToStep(1)} // Arahkan kembali ke awal
                className="mt-6 px-6 py-2 text-sm font-medium text-pmi-dark border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
                Kembali ke Awal
            </button>
        </div>
      );
  }

  // --- Penjaga (Guard) #2: Memeriksa data kavling khusus untuk penyewa tenda ---
  if (tentChoice.type === 'sewa_panitia' && !kavling) {
      return (
        <div className="text-center font-sans text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-pmi-dark">Pemilihan Kavling Diperlukan</h3>
            <p className="mt-2">Anda memilih untuk menyewa tenda, silakan pilih nomor kavling terlebih dahulu.</p>
            <button
                type="button"
                onClick={() => goToStep(5)} // Arahkan ke langkah pemilihan kavling
                className="mt-6 px-6 py-2 text-sm font-medium text-pmi-dark border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
                Pilih Kavling
            </button>
        </div>
      );
  }

  // Setelah melewati guard di atas, TypeScript tahu bahwa schoolData, excelData, dan tentChoice
  // tidak lagi null, sehingga kita bisa mengakses propertinya dengan aman.

  // Fungsi cerdas untuk tombol "Kembali"
  const handlePrevStep = () => {
      // Jika pengguna membawa tenda sendiri, step sebelumnya adalah Step 4.
      if (tentChoice.type === 'bawa_sendiri') {
          goToStep(4);
      } else {
          // Jika pengguna sewa tenda, step sebelumnya adalah Step 5.
          prevStep();
      }
  };

  return (
    <div className="font-serif space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-pmi-dark">Konfirmasi & Ringkasan Pendaftaran</h2>
        <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
          Mohon periksa kembali semua data dengan teliti. Ini adalah langkah terakhir sebelum proses pembayaran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 className="text-2xl font-bold text-pmi-dark flex items-center gap-3">
                    <School className="h-6 w-6" /> Identitas Kontingen
                </h3>
                <dl className="mt-4 space-y-1">
                    <SummaryRow label="Nama Sekolah" value={schoolData.schoolName} />
                    <SummaryRow label="Nama Pembina" value={schoolData.coachName} />
                    <SummaryRow label="Narahubung (WA)" value={schoolData.whatsappNumber} />
                    <SummaryRow label="Kategori Unit" value={schoolData.category} />
                </dl>
            </motion.div>

             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-2xl font-bold text-pmi-dark flex items-center gap-3">
                    <Tent className="h-6 w-6" /> Detail Akomodasi
                </h3>
                <dl className="mt-4 space-y-1">
                    {tentChoice.type === 'bawa_sendiri' ? (
                        <SummaryRow label="Jenis Tenda" value="Bawa Sendiri (Kavling ditentukan panitia)" />
                    ) : (
                        <>
                            <SummaryRow label="Jenis Tenda" value={`Sewa (Kapasitas ${tentChoice.capacity})`} />
                            <SummaryRow label="Nomor Kavling Terpilih" value={`${kavling?.number} (Zona Kap. ${kavling?.capacity})`} />
                        </>
                    )}
                </dl>
            </motion.div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-6 border-2 rounded-lg bg-white shadow-sm space-y-4"
        >
            <h3 className="text-2xl font-bold text-pmi-dark text-center">Rincian Biaya Final</h3>
            <div className="border-t"></div>
            <dl className="space-y-3 font-sans text-sm">
                <div className="flex justify-between">
                    <dt className="text-gray-600">Peserta ({excelData.participants.length} x {formatCurrency(38000)})</dt>
                    <dd className="font-medium">{formatCurrency(costs.participants)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-gray-600">Pendamping ({excelData.companions.length} x {formatCurrency(26000)})</dt>
                    <dd className="font-medium">{formatCurrency(costs.companions)}</dd>
                </div>
                {tentChoice.type === 'sewa_panitia' && tentChoice.cost > 0 && (
                    <div className="flex justify-between">
                        <dt className="text-gray-600">Sewa Tenda (Kap. {tentChoice.capacity})</dt>
                        <dd className="font-medium">{formatCurrency(tentChoice.cost)}</dd>
                    </div>
                )}
            </dl>
            <div className="border-t !mt-6 !mb-4"></div>
            <dl className="space-y-2">
                <div className="flex justify-between font-sans text-lg font-semibold">
                    <dt>Total Pembayaran</dt>
                    <dd className="text-pmi-red text-2xl">{formatCurrency(costs.total)}</dd>
                </div>
            </dl>
             <div className="pt-4 text-center font-sans text-xs text-gray-500 flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Pastikan semua data sudah benar. Data tidak dapat diubah setelah pembayaran.</span>
            </div>
        </motion.div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <button type="button" onClick={handlePrevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark">
            Kembali
        </button>
        <button
            type="button"
            onClick={nextStep}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark"
        >
            <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full"></div>
            <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white">
                Lanjut ke Pembayaran
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
        </button>
      </div>
    </div>
  );
}