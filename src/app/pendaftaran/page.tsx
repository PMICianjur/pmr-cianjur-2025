"use client";

import { useEffect } from "react";
import { useRegistrationStore } from "@/store/registrationStore";

// Komponen Step
import Step1_SchoolData from "@/components/registration/Step1_SchoolData";
import Step2_UploadExcel from "@/components/registration/Step2_UploadExcel";
import Step3_VisualVerification from "@/components/registration/Step3_VisualVerification"; // Komponen baru pengganti Step3
import Step4_TentChoice from "@/components/registration/Step4_TentChoice";
import Step5_KavlingChoice from "@/components/registration/Step5_KavlingChoice";
import Step6_Summary from "@/components/registration/Step6_Summary";
import Step7_Payment from "@/components/registration/Step7_Payment";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";


// Definisikan semua informasi langkah di satu tempat agar mudah dikelola
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

  // useEffect ini berfungsi sebagai "penjaga gerbang" utama untuk alur pendaftaran.
  // Ia memastikan pengguna tidak bisa mengakses langkah yang belum seharusnya.
  useEffect(() => {
    // Jika data sekolah belum ada, paksa pengguna kembali ke step 1
    if (!schoolData && step > 1) {
      console.log("GUARD: No schoolData, redirecting to step 1.");
      goToStep(1);
      return;
    }
    // Jika data excel belum ada, paksa pengguna kembali ke step 2
    if (!excelData && step > 2) {
      console.log("GUARD: No excelData, redirecting to step 2.");
      goToStep(2);
      return;
    }
    // Step 3 (Verifikasi Visual) tidak punya data prasyarat baru, jadi tidak perlu guard spesifik
    
    // Jika pilihan tenda belum ada, paksa kembali ke step 4
    if (!tentChoice && step > 4) {
      console.log("GUARD: No tentChoice, redirecting to step 4.");
      goToStep(4);
      return;
    }
    
    // LOGIKA GUARD BARU UNTUK KAVLING
    // Pengguna hanya boleh berada di step 6 atau 7 jika:
    // 1. Mereka sewa tenda DAN sudah memilih kavling.
    // ATAU
    // 2. Mereka bawa tenda sendiri (di mana kavling tidak relevan).
    const isSewaAndHasKavling = tentChoice?.type === 'sewa_panitia' && kavling !== null;
    const isBawaSendiri = tentChoice?.type === 'bawa_sendiri';

    // Jika pengguna berada di step setelah pemilihan kavling (step > 5)
    // TAPI tidak memenuhi salah satu dari dua kondisi di atas,
    // maka paksa mereka kembali ke step 5.
    if (!(isSewaAndHasKavling || isBawaSendiri) && step > 5) {
        console.log("GUARD: Invalid state for step > 5, redirecting to step 5.");
        goToStep(5);
        return;
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
                {stepsInfo[step - 1].description}
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
                        <p className={`mt-2 text-xs text-center font-semibold hidden md:block ${step === index + 1 ? 'text-pmi-dark' : 'text-gray-400'}`}>{info.title}</p>
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