"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, User, Users, UserCheck, Tent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { type RegistrationDetailPayload } from "@/types/registration";

const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export function PendaftarDetailModal({ 
    registrationId, 
    isOpen, 
    onClose 
}: { 
    registrationId: number | null; 
    isOpen: boolean; 
    onClose: () => void; 
}) {
     const [detail, setDetail] = useState<RegistrationDetailPayload | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && registrationId) {
            const fetchDetail = async () => {
                setIsLoading(true);
                setError(null);
                setDetail(null);
                try {
                    const response = await fetch(`/api/admin/registration-detail/${registrationId}`);
                    if (!response.ok) {
                        const result = await response.json();
                        throw new Error(result.message || "Gagal memuat data detail pendaftaran.");
                    }
                    const data: RegistrationDetailPayload = await response.json();
                    setDetail(data)
                } catch (err: unknown) { // 1. Gunakan 'unknown'
                    let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
                    // 2. Periksa apakah `err` adalah sebuah objek Error
                    if (err instanceof Error) {
                        errorMessage = err.message;
                    }
                    setError(errorMessage);
                    toast.error("Gagal Memuat Detail", { description: errorMessage });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetail();
        }
    }, [isOpen, registrationId]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-80 gap-4 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-pmi-red" />
                    <p>Memuat data detail...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-80 gap-4 text-red-500">
                    <AlertTriangle className="h-10 w-10" />
                    <p className="font-semibold">Terjadi Kesalahan</p>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }
        if (!detail) {
            return (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                    <p>Tidak ada data untuk ditampilkan.</p>
                </div>
            );
        }
        
        return (
            <div className="space-y-8">
                {/* Info Utama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InfoCard Icon={User} title="Pembina" value={detail.school.coachName} />
                    <InfoCard Icon={Users} title="Peserta" value={`${detail.participants.length} Orang`} />
                    <InfoCard Icon={UserCheck} title="Pendamping" value={`${detail.companions.length} Orang`} />
                    <InfoCard Icon={DollarSign} title="Total Bayar" value={detail.payment ? formatCurrency(detail.payment.amount) : 'N/A'} />
                </div>

                {/* Info Akomodasi & Pembayaran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-neutral-300"><Tent size={18} /> Akomodasi</h3>
                        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-2 text-sm">
                            <InfoRow label="Jenis Tenda" value={detail.tentType === 'SEWA_PANITIA' ? `Sewa (Kap. ${detail.tentCapacity})` : 'Bawa Tenda Sendiri'} />
                            <InfoRow label="Nomor Kavling" value={detail.kavlingNumber ? `#${detail.kavlingNumber}` : 'Ditentukan Panitia'} />
                        </div>
                    </section>
                     <section>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-neutral-300"><DollarSign size={18} /> Status Pembayaran</h3>
                        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-2 text-sm">
                            <InfoRow label="Metode" value={detail.payment?.method || 'N/A'} />
                            <InfoRow label="Status" value={<Badge variant={detail.payment?.status === 'SUCCESS' ? 'success' : 'warning'}>{detail.payment?.status?.replace('_', ' ')}</Badge>} />
                        </div>
                    </section>
                </div>
                 
                {/* Tombol Bukti Bayar */}
                {detail.payment?.manualProofPath && <Button asChild variant="outline" className="w-full"><a href={detail.payment.manualProofPath} target="_blank" rel="noopener noreferrer">Lihat Bukti Pembayaran</a></Button>}

                 {/* Daftar Peserta */}
                <section>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-neutral-300"><Users size={18} /> Daftar Peserta</h3>
                    <div className="border border-neutral-700 rounded-lg max-h-60 overflow-y-auto">
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>TTL</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {detail.participants.map(p => (
                // --- TAMBAHKAN key PROP DI SINI ---
                <TableRow key={p.id}> 
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.fullName}</TableCell>
                    <TableCell>{p.birthPlaceDate}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
</div>
                </section>
                 <section>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-neutral-300"><Users size={18} /> Daftar Pendamping</h3>
                    <div className="border border-neutral-700 rounded-lg max-h-60 overflow-y-auto">
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>TTL</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {detail.companions.map(c => (
                // --- TAMBAHKAN key PROP DI SINI ---
                <TableRow key={c.id}> 
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.fullName}</TableCell>
                    <TableCell>{c.birthPlaceDate}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
</div>
                </section>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-neutral-900 border-neutral-700 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-serif">{detail?.school.name || 'Memuat Detail...'}</DialogTitle>
                    <DialogDescription className="text-neutral-400">Detail lengkap pendaftaran untuk kontingen ini.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-6">
                  {renderContent()}
                </div>
                <DialogFooter className="border-t border-neutral-800 pt-4">
                    <Button onClick={onClose} variant="secondary">Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Komponen helper untuk menampilkan kartu info
const InfoCard = ({ Icon, title, value }: { Icon: React.ElementType, title: string, value: string }) => (
    <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <div className="flex items-center gap-3 text-neutral-400">
            <Icon size={16} />
            <span className="text-sm">{title}</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-white truncate">{value}</p>
    </div>
);

// Komponen helper untuk baris info
const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-white">{value}</span>
    </div>
);