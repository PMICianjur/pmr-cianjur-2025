"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Definisikan opsi tenda di luar komponen
const tentOptions = [
  { capacity: 15, cost: 250000 },
  { capacity: 20, cost: 400000 },
  { capacity: 50, cost: 700000 },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Tipe untuk data ketersediaan dari API
interface TentAvailability {
    15: number;
    20: number;
    50: number;
}

export default function Step4_TentChoice() {
  const { prevStep, nextStep, setTentChoice, tentChoice, setKavling, goToStep } = useRegistrationStore();
  
  const [selectionType, setSelectionType] = useState(tentChoice?.type || null);
  const [sewaSelection, setSewaSelection] = useState(tentChoice?.type === 'sewa_panitia' ? tentChoice : null);
  
  // State baru untuk ketersediaan dan loading
  const [availability, setAvailability] = useState<TentAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tents/availability');
            if (!res.ok) throw new Error("Gagal memuat ketersediaan tenda");
            const data: TentAvailability = await res.json();
            setAvailability(data);
       } catch (error: unknown) { // 1. Tangkap error sebagai 'unknown'
    let errorMessage = "Gagal memuat ketersediaan tenda.";
    
    // 2. Periksa apakah `error` adalah instance dari `Error`
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // 3. Log error asli untuk debugging di konsol developer
    console.error("Fetch Availability Error:", error);
    
    // 4. Tampilkan pesan error yang sudah aman ke pengguna
    toast.error("Gagal Memuat Data", { description: errorMessage });
} finally {
            setIsLoading(false);
        }
    };
    fetchAvailability();
  }, []);

  const handleNext = () => {
    if (selectionType === 'bawa_sendiri') {
      setTentChoice({ type: 'bawa_sendiri', capacity: 0, cost: 0 });
      // Karena tidak memilih kavling, set kavling menjadi null/default
      setKavling(null); // Atau nilai default jika diperlukan
      // Langsung lompat ke Step 6 (Ringkasan)
      goToStep(6); 
    } else if (sewaSelection) {
      setTentChoice(sewaSelection);
      // Lanjut ke Step 5 untuk memilih kavling
      nextStep();
    }
  };
  
  const isNextDisabled = !selectionType || (selectionType === 'sewa_panitia' && !sewaSelection);

  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500 font-sans">
            <Loader2 className="animate-spin w-10 h-10 mb-4" />
            <span>Memeriksa Ketersediaan Tenda...</span>
        </div>
    );
  }

  return (
    <div className="font-serif space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-pmi-dark">Pilihan Akomodasi</h2>
        <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
          Pilih opsi akomodasi tenda untuk kontingen sekolah Anda selama acara berlangsung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opsi 1: Bawa Tenda Sendiri */}
        <motion.div
            onClick={() => {
                setSelectionType('bawa_sendiri');
                setSewaSelection(null);
            }}
            className={`p-8 border-2 rounded-lg cursor-pointer transition-all ${
                selectionType === 'bawa_sendiri' ? 'border-pmi-red bg-red-50' : 'border-gray-300 bg-white hover:border-pmi-dark'
            }`}
            whileHover={{ scale: selectionType !== 'bawa_sendiri' ? 1.03 : 1 }}
            animate={{ scale: selectionType === 'bawa_sendiri' ? 1.03 : 1 }}
        >
            <div className="flex items-center gap-4"> <Home className="h-8 w-8 text-pmi-dark" /> <h3 className="text-2xl font-bold text-pmi-dark">Bawa Sendiri</h3> </div>
            <p className="mt-4 font-sans text-gray-600">
                Kontingen membawa tenda sendiri. <strong className="text-pmi-dark">Anda tidak perlu memilih nomor kavling</strong> dan akan langsung diarahkan ke halaman ringkasan.
            </p>
        </motion.div>

        {/* Opsi 2: Sewa Tenda dari Panitia */}
        <motion.div
             onClick={() => setSelectionType('sewa_panitia')}
             className={`p-8 border-2 rounded-lg transition-all ${
                selectionType === 'sewa_panitia' ? 'border-pmi-red bg-red-50' : 'border-gray-300 bg-white'
             } ${ isLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:border-pmi-dark'}`}
             whileHover={{ scale: selectionType !== 'sewa_panitia' ? 1.03 : 1 }}
             animate={{ scale: selectionType === 'sewa_panitia' ? 1.03 : 1 }}
        >
             <div className="flex items-center gap-4"> <Building className="h-8 w-8 text-pmi-dark" /> <h3 className="text-2xl font-bold text-pmi-dark">Sewa dari Panitia</h3> </div>
            <p className="mt-4 font-sans text-gray-600">
                Pilih kapasitas tenda yang akan disediakan oleh panitia.
            </p>
            <AnimatePresence>
            {selectionType === 'sewa_panitia' && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="space-y-3"
                >
                    {tentOptions.map(opt => {
                        const availableCount = availability ? availability[opt.capacity as keyof TentAvailability] : 0;
                        const isSoldOut = availableCount <= 0;

                        return (
                        <div
                            key={opt.capacity}
                            onClick={() => !isSoldOut && setSewaSelection({ type: 'sewa_panitia', capacity: opt.capacity, cost: opt.cost })}
                            className={`flex justify-between items-center p-4 border rounded-md font-sans transition-all ${
                                sewaSelection?.capacity === opt.capacity ? 'border-pmi-red bg-white shadow-md' : 'border-gray-200 bg-gray-50'
                            } ${isSoldOut ? 'bg-gray-200 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}
                        >
                           <div>
                                <span>Kapasitas {opt.capacity} orang</span>
                                <p className={`text-xs ${isSoldOut ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                    {isSoldOut ? 'Habis Tersewa' : `Tersedia: ${availableCount} unit`}
                                </p>
                           </div>
                            <span className="font-bold">{formatCurrency(opt.cost)}</span>
                        </div>
                    )})}
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <button type="button" onClick={prevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark">
            Kembali
        </button>
        <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark disabled:opacity-50"
        >
            <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0"></div>
            <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white group-disabled:text-pmi-dark">
                {selectionType === 'bawa_sendiri' ? 'Lanjut ke Ringkasan' : 'Lanjut ke Pilih Kavling'}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
        </button>
      </div>
    </div>
  );
}