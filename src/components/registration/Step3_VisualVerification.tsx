"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import Image from "next/image";
import { AlertTriangle, ArrowRight, ImageOff, Users, UserCheck } from "lucide-react";
import { motion, type Variants, type Transition } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BIAYA_PESERTA, BIAYA_PENDAMPING } from '@/config/fees';
;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const cardTransition: Transition = {
    delay: 0, // Akan di-override
    duration: 0.5,
    ease: "easeOut",
};

// Gunakan objek transisi di dalam variants
const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        ...cardTransition,
        delay: i * 0.05, // Override delay
      },
    }),
};


export default function Step3_VisualVerification() {
  const { prevStep, nextStep, excelData } = useRegistrationStore();

  // Penjaga (guard) jika pengguna sampai di sini tanpa data
  if (!excelData || !excelData.participants || excelData.participants.length === 0) {
    return (
        <div className="text-center font-sans text-gray-500">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-pmi-dark">Data Tidak Ditemukan</h3>
            <p className="mt-2">Tidak dapat menemukan data peserta. Harap kembali ke langkah sebelumnya dan unggah file Excel Anda.</p>
            <button
                type="button"
                onClick={prevStep}
                className="mt-6 px-6 py-2 text-sm font-medium text-pmi-dark border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
                Kembali ke Langkah 2
            </button>
        </div>
    );
  }

    const totalBiayaPeserta = excelData.participants.length * BIAYA_PESERTA;
  const totalBiayaPendamping = excelData.companions.length * BIAYA_PENDAMPING;
  const totalKeseluruhan = totalBiayaPeserta + totalBiayaPendamping;

    return (
    <div className="font-serif space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-pmi-dark">Verifikasi Data Kontingen</h2>
        <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
          Harap periksa kembali data peserta, pendamping, dan rincian biaya yang berhasil kami ekstrak dari dokumen Anda.
        </p>
      </div>

      {/* Galeri Peserta */}
      <div>
        <h3 className="text-2xl font-bold text-pmi-dark flex items-center gap-3 mb-6">
            <Users className="h-6 w-6" /> Pratinjau Foto Peserta <Badge variant="secondary">{excelData.participants.length} Orang</Badge>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {excelData.participants.map((p, index) => (
            <motion.div key={p.NO} custom={index} initial="hidden" animate="visible" variants={cardVariants} className="w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm">
                 <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center">
                        {/* HAPUS `(p as any)` */}
                        {p.photoUrl ? (
                            <Image 
                                src={p.photoUrl} 
                                alt={`Foto ${p["NAMA LENGKAP"]}`} 
                                fill 
                                className="object-cover" 
                                sizes="(max-width: 640px) 50vw, 33vw, 25vw, 20vw" 
                            />
                        ) : (
                            <div className="flex flex-col items-center text-center text-gray-400 p-2">
                                <ImageOff className="h-12 w-12" />
                                <span className="mt-2 text-xs font-sans font-semibold">Foto Tidak Ada</span>
                            </div>
                        )}
                    </div>
                <div className="p-3">
                    <p className="font-serif font-semibold text-pmi-dark truncate" title={p["NAMA LENGKAP"]}>{p["NAMA LENGKAP"]}</p>
                    <p className="font-sans text-xs text-gray-500">No. {p.NO}</p>
                </div>
            </motion.div>
            ))}
        </div>
      </div>
      
      {/* Tabel Pendamping */}
      {excelData.companions.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-pmi-dark flex items-center gap-3 mb-6">
                <UserCheck className="h-6 w-6" /> Data Pendamping <Badge variant="secondary">{excelData.companions.length} Orang</Badge>
            </h3>
            <div className="border rounded-lg overflow-hidden">
                <Table className="font-sans">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Nama Lengkap</TableHead>
                            <TableHead>Tempat, Tanggal Lahir</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {excelData.companions.map((c) => (
                            <TableRow key={c.NO}>
                                <TableCell className="font-medium">{c.NO}</TableCell>
                                <TableCell>{c["NAMA LENGKAP"]}</TableCell>
                                <TableCell>{c["TEMPAT, TANGGAL LAHIR"]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>
      )}

      {/* Rincian Biaya */}
      <div>
        <h3 className="text-2xl font-bold text-pmi-dark mb-4">Rincian Biaya Sementara</h3>
        <div className="p-6 border-2 rounded-lg bg-gray-50 space-y-4 font-sans">
            <div className="flex justify-between items-center text-gray-600">
                <span>Biaya Peserta ({excelData.participants.length} x {formatCurrency(BIAYA_PESERTA)})</span>
                <span className="font-medium text-pmi-dark text-lg">{formatCurrency(totalBiayaPeserta)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
                <span>Biaya Pendamping ({excelData.companions.length} x {formatCurrency(BIAYA_PENDAMPING)})</span>
                <span className="font-medium text-pmi-dark text-lg">{formatCurrency(totalBiayaPendamping)}</span>
            </div>
            <div className="border-t my-4"></div>
            <div className="flex justify-between items-center font-serif text-xl font-bold text-pmi-dark">
                <span>Total Biaya Dasar</span>
                <span className="text-pmi-red text-2xl">{formatCurrency(totalKeseluruhan)}</span>
            </div>
             <p className="text-xs text-gray-400 text-right pt-2">*Total biaya belum termasuk opsi akomodasi (tenda).</p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <button 
            type="button" 
            onClick={prevStep} 
            className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark transition-colors"
        >
            Unggah Ulang File
        </button>
        <button
            type="button"
            onClick={nextStep}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark"
        >
            <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full"></div>
            <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white">
                Data Sudah Benar & Lanjut
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
        </button>
      </div>
    </div>
  );
}