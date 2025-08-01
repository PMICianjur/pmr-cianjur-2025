"use client";

import { useState, useCallback } from "react";
import { useRegistrationStore } from "@/store/registrationStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Download, UploadCloud, Loader2, ArrowRight, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function Step2_UploadExcel() {
  const { prevStep, nextStep, setExcelData, tempRegId } = useRegistrationStore();
  
  // State lokal hanya untuk file yang dipilih, sebelum diunggah
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const excelFile = acceptedFiles[0];
    if (excelFile && (excelFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || excelFile.name.endsWith('.xlsx'))) {
      setFile(excelFile);
      toast.info("File siap untuk diproses.", { description: excelFile.name });
    } else {
      toast.error("File tidak valid", { description: "Silakan unggah file dengan format .xlsx" });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false,
    disabled: isLoading,
  });

  const handleProcessAndContinue = async () => {
    if (!file) {
      toast.error("Silakan pilih file Excel terlebih dahulu.");
      return;
    }
    if (!tempRegId) {
        toast.error("Sesi tidak valid. Silakan kembali ke langkah 1.");
        return;
    }
    nextStep();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tempRegId', tempRegId);

    const promise = () => new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/api/registration/upload-excel', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal memproses file Excel.");
            }
            // Simpan data yang sudah diproses oleh backend (termasuk photoUrl) ke store
            setExcelData(result.data);
            nextStep(); // Lanjut ke step verifikasi visual
            resolve(result);
        } catch (error) {
            reject(error as Error);
        }
    });

    toast.promise(promise, {
        loading: 'Mengekstrak data dan foto dari Excel...',
        success: 'Ekstraksi berhasil! Lanjut ke verifikasi.',
        error: (err: Error) => err.message || 'Gagal memproses file.',
    });

    // Jalankan promise untuk menangani state loading secara akurat
    try {
        await promise();
    } catch {
    } finally {
        setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="font-serif space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-pmi-dark">Unggah Dokumen Kontingen</h2>
        <p className="mt-2 font-sans text-gray-600 max-w-2xl mx-auto">
          Unduh template, lalu isi dan masukkan foto peserta langsung di dalam file Excel. Setelah selesai, unggah dokumen tersebut di sini.
        </p>
      </div>

      <div className="flex justify-center">
        <a 
          href="/templates/template-pendaftaran-lengkap.xlsx" // Pastikan nama file template baru sudah benar
          download
          className="group inline-flex items-center gap-3 px-6 py-3 font-sans text-sm font-medium text-pmi-dark border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Download className="h-5 w-5 text-gray-500 group-hover:text-pmi-red" />
          Unduh Template (Termasuk Foto)
        </a>
      </div>

      {/* Area Dropzone dan Tampilan File */}
      <div className="relative max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {!file ? (
            <div {...getRootProps()}> {/* <-- Bungkus dengan div biasa dan pindahkan getRootProps ke sini */}
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-pmi-red bg-red-50' : 'border-gray-300 bg-white hover:border-pmi-dark'}`}
            >
              <input {...getInputProps()} /> {/* Input harus tetap di dalam */}
              <div className="flex flex-col items-center text-center text-gray-500 pointer-events-none">
                <UploadCloud className="h-12 w-12 mb-4" />
                <p className="font-serif text-xl font-semibold text-pmi-dark">Unggah Dokumen .xlsx</p>
                <p className="font-sans text-sm mt-1">Anda bisa seret file ke area ini.</p>
              </div>
            </motion.div>
          </div>
          ) : (
            <motion.div
              key="file-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="border-2 border-gray-200 rounded-lg bg-white shadow-sm p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-md bg-green-100 text-green-600">
                   <FileText className="h-6 w-6" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-serif font-semibold text-pmi-dark truncate">{file.name}</p>
                  <p className="font-sans text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                  onClick={removeFile}
                  className="font-sans text-sm text-gray-500 hover:text-pmi-red underline ml-4 flex-shrink-0"
              >
                  Ganti File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bagian ringkasan dihapus dari sini dan dipindahkan ke Step 3 */}

      <div className="flex justify-between items-center pt-8 border-t">
        <button type="button" onClick={prevStep} className="font-sans text-sm font-medium text-gray-600 hover:text-pmi-dark transition-colors">
            Kembali
        </button>
        <button
            type="button"
            onClick={handleProcessAndContinue}
            disabled={!file || isLoading}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0"></div>
            <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white group-disabled:text-pmi-dark">
                {isLoading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" /> 
                        Memproses File...
                    </>
                ) : (
                    <>
                        Proses & Lanjut ke Verifikasi
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                )}
            </span>
        </button>
      </div>
    </div>
  );
}