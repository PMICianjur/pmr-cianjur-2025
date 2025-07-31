"use client";

import { useRegistrationStore } from "@/store/registrationStore";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, MapPin, AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Image from "next/image";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface AvailableKavlings {
  [capacity: number]: number[];
}

// Koordinat Blok Kavling dalam persentase
const blockCoordinates = {
  MADYA: { top: '12.5%', left: '13%', width: '18%', height: '14%', name: 'Blok Gn. Putri / Pangrango' },
  WIRA: { top: '10%', left: '48.5%', width: '24%', height: '43%', name: 'Blok Gn. Gede/Gn.GegerBentang', },
};

// Layout Zona di dalam setiap blok
const zoneLayouts = {
    15: { range: "41-60", gridClass: 'grid-cols-5' },
    20: { range: "21-40", gridClass: 'grid-cols-5' },
    50: { range: "1-20", gridClass: 'grid-cols-5' },
};
export default function Step5_KavlingChoice() {
  const { prevStep, nextStep, setKavling, tentChoice, kavling, schoolData } = useRegistrationStore();
  const [available, setAvailable] = useState<AvailableKavlings>({});
  const [isLoading, setIsLoading] = useState(true);

  const relevantCapacity = useMemo(() => {
    if (!tentChoice) return 15;
    return tentChoice.type === 'sewa_panitia' ? tentChoice.capacity : 15;
  }, [tentChoice]);

  useEffect(() => {
    if (!schoolData?.category) {
        toast.error("Kategori sekolah tidak ditemukan.");
        setIsLoading(false);
        return;
    }
    const fetchKavling = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/kavling/available?category=${schoolData.category}`);
        if (!res.ok) throw new Error("Gagal memuat data kavling");
        const data: AvailableKavlings = await res.json();
        setAvailable(data);
      } catch (error: unknown) { // 1. Tangkap error sebagai 'unknown'
    let errorMessage = "Terjadi kesalahan saat memuat data kavling.";
    
    // 2. Periksa apakah `error` adalah instance dari `Error`
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // 3. Log error asli untuk debugging
    console.error("Fetch Kavling Error:", error);
    
    // 4. Tampilkan pesan error yang sudah aman
    toast.error("Gagal Memuat Kavling", { description: errorMessage });
} finally {
        setIsLoading(false);
      }
    };
    fetchKavling();
  }, [schoolData?.category]);

  const handleSelect = (num: number) => {
    if (kavling?.number === num) {
        setKavling(null);
    } else {
        setKavling({ number: num, capacity: relevantCapacity });
    }
  };

  const activeBlock = schoolData ? blockCoordinates[schoolData.category] : null;

  if (!schoolData) {
    return (
        <div className="text-center font-sans text-gray-500">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-pmi-dark">Data Sekolah Tidak Ditemukan</h3>
        </div>
    );
  }

  return (
    <div className="font-serif space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-pmi-dark">Denah & Penentuan Kavling</h2>
        <p className="mt-2 text-lg text-pmi-red font-semibold">{activeBlock?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
            {/* --- Kontrol Zoom --- */}
            <div className="font-sans text-sm text-gray-500 text-center">
                Gunakan scroll mouse atau gestur pinch untuk zoom. Klik dan seret untuk menggeser denah.
            </div>
            {/* --- Peta Interaktif dengan Zoom --- */}
            <div className="relative w-full border-2 rounded-lg overflow-hidden shadow-sm cursor-grab active:cursor-grabbing">
                <TransformWrapper>
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            <div className="absolute top-2 right-2 z-30 flex flex-col gap-2">
                                <button onClick={() => zoomIn()} className="p-2 bg-white/80 rounded-md shadow hover:bg-gray-100"><ZoomIn size={18}/></button>
                                <button onClick={() => zoomOut()} className="p-2 bg-white/80 rounded-md shadow hover:bg-gray-100"><ZoomOut size={18}/></button>
                                <button onClick={() => resetTransform()} className="p-2 bg-white/80 rounded-md shadow hover:bg-gray-100"><RotateCcw size={18}/></button>
                            </div>

                            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                <div className="relative w-full h-full">
                                    <AnimatePresence>
                                        {isLoading && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 z-20 flex flex-col justify-center items-center">
                                                <Loader2 className="animate-spin w-10 h-10 text-pmi-red mb-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <Image
                                        src="/denah-lokasi.jpg"
                                        alt="Denah Lokasi Mandala Kitri Scout Camp"
                                        width={1600} height={1126} layout="responsive" priority
                                    />

                                    {/* --- Perbaikan Logika Render Blok --- */}
                                    {activeBlock && (
                                        <div className="absolute z-20" style={{ ...activeBlock }}>
                                            <div className={`relative w-full h-full p-1 grid grid-cols-5 gap-1`}>
                                                {Object.entries(zoneLayouts).flatMap(([capacityStr, layout]) => {
                                                    const capacity = parseInt(capacityStr);
                                                    const kavlingNumbers = Array.from({ length: parseInt(layout.range.split('-')[1]) - parseInt(layout.range.split('-')[0]) + 1 }, (_, i) => parseInt(layout.range.split('-')[0]) + i);
                                                    
                                                    return kavlingNumbers.map(num => {
                                                        const isAvailable = available[capacity]?.includes(num);
                                                        const isSelected = kavling?.number === num;
                                                        const isRelevant = capacity === relevantCapacity;

                                                        return (
                                                            <button
                                                                key={`${capacity}-${num}`}
                                                                onClick={() => isAvailable && isRelevant && handleSelect(num)}
                                                                disabled={!isAvailable || !isRelevant}
                                                                title={isSelected ? `Kavling ${num} (Dipilih)` : !isAvailable ? `Kavling ${num} (Dipesan)` : `Pilih Kavling ${num}`}
                                                                className={`relative rounded-sm text-[8px] font-sans font-bold transition-all duration-200 aspect-square
                                                                    ${isSelected ? 'bg-pmi-red text-white scale-125 z-10' : ''}
                                                                    ${!isAvailable ? 'bg-gray-400/80 text-gray-200 cursor-not-allowed line-through' : ''}
                                                                    ${isAvailable && !isSelected && isRelevant ? 'border-2 border-red-700 bg-white/80 text-pmi-dark hover:bg-pmi-red hover:text-white' : ''}
                                                                    ${isAvailable && !isRelevant ? 'border-2 border-grey-800 bg-gray-200/50 text-gray-400 cursor-not-allowed' : ''}
                                                                `}
                                                            >
                                                                {num}
                                                            </button>
                                                        );
                                                    })
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </div>

        {/* Kolom Panel Ringkasan */}
        <div className="lg:sticky top-28 p-6 border-2 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-bold text-pmi-dark flex items-center gap-2">
                <MapPin className="h-6 w-6 text-pmi-red" />
                Kavling Terpilih
            </h3>
            <div className="border-t my-4"></div>
            <p className="font-sans text-sm text-gray-500 mb-4">
                Blok Anda adalah <strong className="text-pmi-dark">{activeBlock?.name}</strong>. Silakan pilih kavling dari zona yang sesuai dengan kapasitas tenda Anda.
            </p>
            <AnimatePresence>
            {kavling ? (
                <motion.div key="selected" initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0 }} exit={{ opacity: 0 }} className="text-center space-y-2 bg-green-50 border border-green-200 p-4 rounded-md">
                    <p className="font-sans text-green-700">Pilihan Anda:</p>
                    <p className="font-serif text-6xl font-bold text-green-800">{kavling.number}</p>
                    <p className="font-sans font-semibold text-gray-700">{activeBlock?.name}</p>
                    <p className="font-sans text-green-700">Kapasitas {kavling.capacity} Orang</p>
                </motion.div>
            ) : (
                <motion.div key="unselected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center font-sans text-gray-500 py-8">
                    <p>Belum ada kavling yang dipilih.</p>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex justify-between items-center pt-8 border-t">
        <button type="button" onClick={prevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark">
            Kembali
        </button>
        <button
            type="button"
            onClick={nextStep}
            disabled={!kavling || isLoading}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0"></div>
            <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white group-disabled:text-pmi-dark">
                Lanjut ke Ringkasan
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
        </button>
      </div>
    </div>
  );
}

