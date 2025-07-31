"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from 'next/image';
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  schoolName: string;
}

export function PaymentProofModal({ isOpen, onClose, imageUrl, schoolName }: PaymentProofModalProps) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            // Reset status loading saat modal ditutup
            setTimeout(() => setImageLoading(true), 300);
        }
    }}>
      <DialogContent className="sm:max-w-xl bg-neutral-900 border-neutral-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Bukti Pembayaran</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Bukti transfer manual untuk kontingen <span className="font-semibold text-white">{schoolName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
            {imageUrl ? (
                <div className="relative w-full h-auto min-h-[450px] flex items-center justify-center bg-black rounded-md overflow-hidden border border-neutral-700">
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    <Image
                        src={imageUrl}
                        alt={`Bukti pembayaran untuk ${schoolName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 60vw"
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)} // Handle jika gambar gagal dimuat
                    />
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    Tidak ada gambar bukti pembayaran untuk ditampilkan.
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}