// src/components/registration/ManualPaymentDialog.tsx
"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UploadCloud, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { type RegistrationData } from '@/lib/registrationFinalizer';

interface ManualPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  // Prop ini sekarang mengharapkan tipe RegistrationData yang sudah kita perbaiki
  registrationData: RegistrationData;
  totalAmount: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};


export function ManualPaymentDialog({ isOpen, onClose, onSuccess, registrationData, totalAmount }: ManualPaymentDialogProps) {
  const [file, setFile] = useState<(File & { preview: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const imageFile = acceptedFiles[0];
      setFile(Object.assign(imageFile, { preview: URL.createObjectURL(imageFile) }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: false,
  });
  
  const handleUpload = async () => {
    if (!file) {
      toast.error("Harap pilih file bukti pembayaran terlebih dahulu.");
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
     console.log("--- DATA BEING SENT TO MANUAL UPLOAD API ---");
    console.log(JSON.stringify(registrationData, null, 2));
    // Periksa secara spesifik array companions
    console.log("Companions count in sent data:", registrationData.excelData?.companions?.length);
    formData.append('registrationData', JSON.stringify(registrationData));
    formData.append('paymentProof', file);

    try {
        const response = await fetch('/api/payment/manual-upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Gagal mengunggah bukti.");
        }
        toast.success("Upload berhasil!", { description: "Pendaftaran Anda akan segera dikonfirmasi oleh panitia."});
        onSuccess(result.orderId);
    } catch (err: unknown) { // Gunakan 'unknown' untuk error
        let errorMessage = "Gagal mengunggah bukti.";
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        toast.error("Upload Gagal", { description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] font-sans bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Pembayaran Manual</DialogTitle>
          <DialogDescription>
            Silakan lakukan transfer sejumlah <strong className="text-pmi-red">{formatCurrency(totalAmount)}</strong> ke rekening berikut:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="p-4 bg-gray-100 rounded-md text-center">
                <p className="font-semibold text-pmi-dark">Bank BCA</p>
                <p className="text-xl font-bold tracking-wider my-1">1234 5678 9012</p>
                <p>a.n. Panitia PMR Cianjur</p>
            </div>
            <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-pmi-red bg-red-50' : 'border-gray-200'}`}>
                <input {...getInputProps()} />
                {file ? (
                    <div className="relative w-32 h-32 mx-auto">
                        <Image src={file.preview} alt="Preview Bukti" layout="fill" className="object-contain rounded-md" />
                    </div>
                ) : (
                    <div className="text-gray-500">
                        <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                        <p>Unggah Bukti Transfer</p>
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button type="button" onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Konfirmasi Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}