"use client";

import { useEffect, useMemo } from "react";
import { useRegistrationStore } from "@/store/registrationStore";

// Komponen Step
import Step1_SchoolData from "@/components/registration/Step1_SchoolData";
import Step2_UploadExcel from "@/components/registration/Step2_UploadExcel";
import Step3_VisualVerification from "@/components/registration/Step3_VisualVerification";
import Step4_TentChoice from "@/components/registration/Step4_TentChoice";
import Step5_KavlingChoice from "@/components/registration/Step5_KavlingChoice";
import Step6_Summary from "@/components/registration/Step6_Summary";
import Step7_Payment from "@/components/registration/Step7_Payment";

// UI & Animasi
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
// Impor `useWindowSize` dan `Confetti` jika Anda menggunakannya
// import useWindowSize from 'react-use/lib/useWindowSize';
// import Confetti from 'react-confetti';

// Definisikan Zod schema di sini (opsional, bisa dipindah ke file tipe)
export const SchoolDataSchema = z.object({
  schoolName: z.string().min(5, "Nama sekolah minimal 5 karakter"),
  coachName: z.string().min(3, "Nama pembina minimal 3 karakter"),
  whatsappNumber: z.string().min(10, "Nomor WhatsApp tidak valid").max(15),
  category: z.enum(["WIRA", "MADYA"], {
    required_error: "Anda harus memilih kategori sekolah",
  }),
});

const stepsInfo = [
    { title: "Identitas Sekolah", description: "Langkah awal untuk mengenali kontingen Anda." },
    { title: "Unggah Dokumen", description: "Unggah daftar lengkap anggota dan foto via Excel." },
    { title: "Verifikasi Visual", description: "Pastikan data dan foto berhasil diekstrak." },
    { title: "Pilihan Akomodasi", description: "Tentukan pilihan tenda untuk kenyamanan tim." },
    { title: "Penentuan Kavling", description: "Pilih lokasi strategis untuk basecamp Anda." },
    { title: "Konfirmasi & Ringkasan", description: "Periksa kembali semua data sebelum finalisasi." },
    { title: "Proses Pembayaran", description: "Selesaikan pendaftaran dengan melakukan pembayaran." }
];

export default function PendaftaranPage() {
  const {
    step,
    schoolData,
    excelData,
    tentChoice,
    kavling,
    goToStep,
  } = useRegistrationStore();

  console.log(`PendaftaranPage RENDERED, current step is: ${step}`);

  // --- useEffect "Guard" dengan Pola Early Return ---
  useEffect(() => {
    // Penjaga ini memastikan pengguna tidak bisa berada di step
    // yang prasyaratnya belum terpenuhi. Ia akan selalu
    // "menendang" pengguna kembali ke langkah terakhir yang valid.
    
    // Untuk bisa ke step > 1, HARUS ada schoolData.
    if (step > 1 && !schoolData) {
      console.log("GUARD: Prasyarat Step 1 (schoolData) tidak terpenuhi. Kembali ke Step 1.");
      return goToStep(1);
    }

    // Untuk bisa ke step > 2, HARUS ada excelData.
    if (step > 2 && !excelData) {
      console.log("GUARD: Prasyarat Step 2 (excelData) tidak terpenuhi. Kembali ke Step 2.");
      return goToStep(2);
    }

    // (Step 3 adalah verifikasi, tidak menghasilkan data baru, jadi tidak perlu guard untuk step > 3)

    // Untuk bisa ke step > 4, HARUS ada tentChoice.
    if (step > 4 && !tentChoice) {
      console.log("GUARD: Prasyarat Step 4 (tentChoice) tidak terpenuhi. Kembali ke Step 4.");
      return goToStep(4);
    }
    
    // Untuk bisa ke step > 5, HARUS sewa tenda.
    // Jika pengguna mencoba akses step 5 tapi bawa tenda sendiri, tendang ke step 4.
    if (step === 5 && tentChoice?.type === 'bawa_sendiri') {
      console.log("GUARD: Pengguna 'bawa_sendiri' tidak bisa akses Step 5. Kembali ke Step 4.");
      return goToStep(4);
    }
    
    // Untuk bisa ke step > 6, HARUS memenuhi kondisi kavling atau bawa sendiri.
    if (step > 5) {
        const isSewaAndHasKavling = tentChoice?.type === 'sewa_panitia' && kavling !== null;
        const isBawaSendiri = tentChoice?.type === 'bawa_sendiri';
        if (!(isSewaAndHasKavling || isBawaSendiri)) {
            console.log("GUARD: Prasyarat Step 5 (kavling) tidak terpenuhi. Kembali ke Step 5.");
            return goToStep(5);
        }
    }

  }, [step, schoolData, excelData, tentChoice, kavling, goToStep]);


  const renderStep = () => {
    switch (step) {
      case 1: return <Step1_SchoolData />;
      case 2: return <Step2_UploadExcel />;
      case 3: return <Step3_VisualVerification />;
      case 4: return <Step4_TentChoice />;
      case 5: return <Step5_KavlingChoice />;
      case 6: return <Step6_Summary />;
      case 7: return <Step7_Payment />;
      default:
        // Jika karena suatu alasan step tidak valid, selalu kembalikan ke awal.
        goToStep(1);
        return <Step1_SchoolData />;
    }
  };
  
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 },
  } as const;

  const pageTransition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  } as const;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-5xl py-12 lg:py-20 font-sans">
        <div className="space-y-4 mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-serif text-pmi-dark">
                Formulir Pendaftaran
            </h1>
            <p className="text-lg text-gray-500">
                {stepsInfo[step - 1]?.description || 'Memuat...'}
            </p>
        </div>

        <div className="mb-8 px-4">
            <div className="relative flex items-center justify-between">
                {stepsInfo.map((info, index) => (
                    <div key={index} className="relative z-10 flex flex-col items-center">
                        <motion.div
                            className="h-8 w-8 rounded-full flex items-center justify-center border-2"
                            animate={step > index + 1 ? "completed" : step === index + 1 ? "active" : "inactive"}
                            variants={{
                                completed: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
                                active: { backgroundColor: "#FFFFFF", borderColor: "#DC2626", scale: 1.1 },
                                inactive: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {step > index + 1 ? <Check className="h-5 w-5 text-white" /> : <span className={`font-bold ${step === index + 1 ? 'text-pmi-red' : 'text-gray-400'}`}>{index + 1}</span>}
                        </motion.div>
                        <p className={`mt-2 text-xs text-center font-semibold hidden md:block ${step === index + 1 ? 'text-pmi-dark' : 'text-gray-400'}`}>{stepsInfo[index]?.title || ''}</p>
                    </div>
                ))}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
                    <motion.div
                        className="h-full bg-pmi-red"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (step - 1) / (stepsInfo.length - 1) }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        style={{ transformOrigin: 'left' }}
                    />
                </div>
            </div>
        </div>
        
        <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="p-6 sm:p-8 md:p-12"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}