"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { FormattedRegistration } from "@/types/admin";
import { MoreHorizontal, Download, ListFilter,ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, Receipt, Loader2, FileText } from "lucide-react";
import { SchoolCategory, PaymentStatus } from "@prisma/client";
import { toast } from 'sonner';
import { motion } from "framer-motion";
import { PendaftarDetailModal } from './PendaftarDetailModal';
import { PaymentProofModal } from './PaymentProofModal';
import * as XLSX from 'xlsx';
import { useRouter } from "next/navigation";
import { TooltipProvider, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";
import { Tooltip } from "../ui/tooltip";
import { MessageSquare } from "lucide-react";

// Fungsi helper untuk mendapatkan varian warna badge berdasarkan status pembayaran
const getStatusBadgeVariant = (status?: PaymentStatus) => {
    if (!status) return 'outline';
    switch (status) {
        case 'SUCCESS': return 'success';
        case 'WAITING_CONFIRMATION': return 'warning';
        case 'PENDING': return 'secondary';
        case 'FAILED': case 'EXPIRED': return 'destructive';
        default: return 'outline';
    }
};

interface ApiResponse {
    message: string;
    // Tambahkan properti lain jika API Anda mengembalikannya
    // Contoh: payment?: any;
}

const paymentStatuses: PaymentStatus[] = ["SUCCESS", "WAITING_CONFIRMATION", "PENDING", "FAILED", "EXPIRED"];
const categories: SchoolCategory[] = ["WIRA", "MADYA"];

export function PendaftarTableWrapper() {
  const router = useRouter();
  const [data, setData] = React.useState<FormattedRegistration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = React.useState<number | null>(null);

  const [isProofModalOpen, setIsProofModalOpen] = React.useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = React.useState<string | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = React.useState<string>("");

 React.useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Kita tidak perlu lagi API terpisah, kita bisa fetch langsung dari Server Component
            // Namun, untuk filter dinamis, API terpisah lebih baik. Mari kita asumsikan API-nya ada.
            // Jika Anda tidak membuat API, Anda perlu meneruskan data sebagai prop.
            // Karena kita ingin filter dinamis, kita akan buat API-nya.
            
            // NOTE: Anda perlu membuat API Route di /api/admin/registrations
            const response = await fetch('/api/admin/registrations');
            if(!response.ok) throw new Error("Gagal mengambil data pendaftar");
            const fetchedData = await response.json();
            setData(fetchedData);
        } catch (error: unknown) { // 1. Gunakan `unknown`
            let errorMessage = "Gagal mengambil data pendaftar.";
            // 2. Lakukan type guard
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error("Gagal Memuat Data", { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
}, []);

  const handleViewDetail = (id: number) => {
    setSelectedRegistrationId(id);
    setIsDetailModalOpen(true);
  };
  
  const handleViewProof = (proofUrl: string, schoolName: string) => {
    setSelectedProofUrl(proofUrl);
    setSelectedSchoolName(schoolName);
    setIsProofModalOpen(true);
    
  };



  

  const columns: ColumnDef<FormattedRegistration>[] = React.useMemo(() => [
    {
        accessorKey: "normalizedName",
        header: "Nama Sekolah",
        cell: ({ row }) => <div className="font-medium text-black">{row.original.normalizedName}</div>
    },
    {
        accessorKey: "whatsappNumber",
        header: "Pembina",
         cell: ({ row }) => {
            const { coachName, whatsappNumber } = row.original;
            
            // Sanitasi nomor HP: hapus karakter non-digit, pastikan diawali 62
            let cleanPhoneNumber = whatsappNumber.replace(/\D/g, ''); // Hapus semua selain angka
            if (cleanPhoneNumber.startsWith('0')) {
                cleanPhoneNumber = '62' + cleanPhoneNumber.substring(1);
            } else if (!cleanPhoneNumber.startsWith('62')) {
                cleanPhoneNumber = '62' + cleanPhoneNumber;
            }

            const whatsappUrl = `https://wa.me/${cleanPhoneNumber}`;

            return (
                <div className="flex flex-col">
                    <span className="font-medium">{coachName}</span>
                    <a 
                        href={whatsappUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground text-sm flex items-center gap-1 hover:text-green-400 transition-colors"
                    >
                        <MessageSquare className="h-3 w-3" />
                        {whatsappNumber}
                    </a>
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: "Kategori",
         cell: ({ row }) => {
        const category = row.getValue("category") as SchoolCategory;
        
        // --- LOGIKA BARU UNTUK VARIAN WARNA ---
        const variant = category === 'WIRA' ? 'wira' : 'madya';

        return <Badge variant={variant}>{category}</Badge>;
    }
    },
    {
        accessorKey: "status",
        header: "Status Bayar",
        cell: ({ row }) => {
            const status = row.original.status;
            return <Badge variant={getStatusBadgeVariant(status)}>{status?.replace('_', ' ')}</Badge>;
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        accessorKey: "totalFee",
        header: () => <div className="text-right">Total Bayar</div>,
        cell: ({ row }) => {
            const amount = row.original.totalFee;
            const formatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        }
    },
    
            {
    id: "dokumen",
    header: () => <div className="text-center">Dokumen</div>,
    enableHiding: false,
    cell: ({ row }) => {
        // --- PERBAIKAN CARA MENGAMBIL DATA ---
        const { excelFilePath, receiptPath } = row.original;


        // Jika tidak ada dokumen sama sekali, tampilkan strip
        if (!excelFilePath && !receiptPath) {
            return <div className="text-center text-muted-foreground">-</div>;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        // Buat URL viewer hanya jika excelFilePath ada
        const viewerUrl = excelFilePath 
            ? `https://docs.google.com/gview?url=${encodeURIComponent(`${appUrl}${excelFilePath}`)}&embedded=true`
            : '#';
        
        return (
            <div className="flex gap-2 justify-center">
                <TooltipProvider>
                    {/* Tombol Dokumen Excel (Dropdown) */}
                    {excelFilePath && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white">
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">Opsi File Excel</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-700 text-white">
                                <DropdownMenuLabel>File Pendaftaran</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-neutral-700" />
                                <DropdownMenuItem asChild>
                                    <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <ExternalLink className="h-4 w-4" /> Lihat di Browser
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={excelFilePath} download className="flex items-center gap-2 cursor-pointer">
                                        <Download className="h-4 w-4" /> Unduh Langsung
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    
                    {/* Tombol Kwitansi PDF */}
                    {receiptPath && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon" className="h-8 w-8 bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white">
                                    <a href={receiptPath} target="_blank" rel="noopener noreferrer">
                                        <Receipt className="h-4 w-4 text-green-400" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat/Unduh Kwitansi PDF</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>
        );
    },
},
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const registration = row.original;

            const handleDelete = async () => {
                // Tampilkan dialog konfirmasi browser
                if (!confirm(`PERINGATAN:\n\nApakah Anda benar-benar yakin ingin menghapus pendaftaran untuk ${registration.normalizedName}?\n\nAksi ini akan menghapus semua data terkait (peserta, pembayaran, file) dan tidak dapat dibatalkan.`)) {
                    return; // Batalkan jika pengguna klik "Cancel"
                }

                // Gunakan toast.promise untuk feedback UI yang bagus
                const promise = (): Promise<ApiResponse> => new Promise(async (resolve, reject) => {
                    try {
                        const response = await fetch('/api/admin/delete-registration', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ registrationId: registration.id }),
                        });

                         const result: ApiResponse = await response.json(); // <-- Beri tipe pada hasil json()
                        if (!response.ok) {
                            throw new Error(result.message || "Gagal menghapus pendaftaran.");
                        }
                        
                        router.refresh(); 
                        resolve(result);
                    } catch (error) {
                        reject(error as Error);
                    }
                });

                toast.promise(promise, {
                    loading: `Menghapus pendaftaran untuk ${registration.normalizedName}...`,
                    success: (result: ApiResponse) => result.message, // <-- Gunakan tipe yang benar, tidak perlu `any`
                    error: (err: Error) => err.message,
                });
            };

             const handleConfirmPayment = async () => {
                if (!registration.paymentId) {
                    toast.error("Tidak dapat menemukan ID pembayaran.");
                    return;
                }
                
                if (!confirm(`Apakah Anda yakin ingin mengkonfirmasi pembayaran untuk ${registration.normalizedName}?`)) {
                    return;
                }

                const promise = (): Promise<ApiResponse> => new Promise(async (resolve, reject) => {
                    try {
                        const response = await fetch('/api/admin/confirm-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentId: registration.paymentId }),
                        });

                        const result: ApiResponse = await response.json(); // <-- Beri tipe pada hasil json()
        if (!response.ok) {
            throw new Error(result.message || "Gagal mengkonfirmasi pembayaran.");
        }
        
        router.refresh(); 
        resolve(result);
    } catch (error) {
        reject(error as Error);
    }
});

               toast.promise(promise, {
    loading: `Mengkonfirmasi pembayaran untuk ${registration.normalizedName}...`,
    success: (result: ApiResponse) => result.message, // <-- Gunakan tipe yang benar, tidak perlu `any`
    error: (err: Error) => err.message,
});
            };
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" className="text-black border-black h-8 w-8 p-0 hover:bg-black hover:text-white"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-pmi-red border-neutral-700 text-white">
                        <DropdownMenuLabel className="text-center bg-red-700 rounded-md ">Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleViewDetail(registration.id)} className="text-white hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200">Lihat Detail</DropdownMenuItem>
                         {registration.status === 'WAITING_CONFIRMATION' && 
                            <DropdownMenuItem onSelect={handleConfirmPayment} className="text-white hover:bg-red-800 ...">
                                Konfirmasi Pembayaran
                            </DropdownMenuItem>
                        }
                        {registration.manualProofPath && <DropdownMenuItem onSelect={() => handleViewProof(registration.manualProofPath!, registration.normalizedName)} className="text-white focus:bg-red-800 focus:text-white rounded-lg transition-colors duration-200" >Lihat Bukti Bayar</DropdownMenuItem>}

                        <DropdownMenuSeparator className="bg-black"/>
                        <DropdownMenuItem
                            // Gunakan onSelect untuk integrasi terbaik dengan shadcn
                            onSelect={(e) => {
                                e.preventDefault(); // Mencegah dropdown menutup saat dialog `confirm` muncul
                                handleDelete();
                            }}
                             className="text-white focus:bg-red-900/50 focus:text-red-400"
                        >
                            Hapus Pendaftaran
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
  ], [router]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const handleExport = () => {
      toast.info("Mempersiapkan file Excel untuk diunduh...");
      const dataToExport = table.getFilteredRowModel().rows.map(row => {
          const reg = row.original;
          return {
              'ID': reg.id,
              'Nama Sekolah': reg.normalizedName,
              'Kategori': reg.category,
              'Status Pembayaran': reg.status,
              'Metode Pembayaran': reg.method,
              'Total Biaya': reg.totalFee,
              'Jumlah Peserta': reg.participantCount,
              'Jumlah Pendamping': reg.companionCount,
              'Tanggal Daftar': new Date(reg.createdAt).toLocaleString('id-ID'),
              'Link Excel': reg.excelFilePath ? `${process.env.NEXT_PUBLIC_APP_URL}${reg.excelFilePath}` : 'N/A',
          };
      });
      if (dataToExport.length === 0) {
          toast.error("Tidak ada data untuk diekspor.");
          return;
      }
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
      XLSX.writeFile(workbook, `Data-Pendaftar-PMR-2025-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("File Excel berhasil diunduh!");
  };

        const activeFilterCount = columnFilters.filter(f => f.id !== 'normalizedName').length; 

  return (
     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Input
              placeholder="Cari sekolah..."
              value={(table.getColumn("normalizedName")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("normalizedName")?.setFilterValue(event.target.value)}
              className="max-w-xs w-full bg-transparent border-neutral-700 focus:ring-pmi-red"
            />
            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto gap-1 border-neutral-700 hover:bg-neutral-800 hover:text-white">
                            <ListFilter className="h-4 w-4" />
                            <span>Filter</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-pmi-red border-red-600 text-white">
                        <DropdownMenuLabel>Filter Pendaftar</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-red-700"/>
                        <DropdownMenuLabel className="font-normal text-white">Kategori</DropdownMenuLabel>
                        {categories.map(category => (
                            <DropdownMenuCheckboxItem key={category} className="bg-pmi-red rounded-md hover:bg-red-800 transition-colors duration-200" 
                checked={table.getColumn("category")?.getFilterValue() === category} 
            onCheckedChange={(isChecked) => {
                // Logika yang lebih sederhana dan aman dari segi tipe
                if (isChecked) {
                    table.getColumn("category")?.setFilterValue(category);
                } else {
                    table.getColumn("category")?.setFilterValue(undefined);
                }
            }}
        >
            {category}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator className="bg-red-700"/>
                        <DropdownMenuLabel className="font-normal text-white">Status Pembayaran</DropdownMenuLabel>
                        {paymentStatuses.map(status => (
                            <DropdownMenuCheckboxItem key={status} className="bg-pmi-red rounded-md hover:bg-red-800 transition-colors duration-200"  checked={table.getColumn("status")?.getFilterValue() === status}
                        onCheckedChange={(isChecked) => {
                            if (isChecked) {
                                table.getColumn("status")?.setFilterValue(status);
                            } else {
                                table.getColumn("status")?.setFilterValue(undefined);
                            }
                        }}
                    >
                                {status.replace('_', ' ')}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {activeFilterCount > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-neutral-700"/>
                                <DropdownMenuItem onSelect={() => table.resetColumnFilters()}>
                                    Reset Semua Filter
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="w-full sm:w-auto gap-1 border-neutral-700 hover:bg-neutral-800 hover:text-white" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Ekspor
                </Button>
            </div>
        </div>
        
        <div className="rounded-lg border border-black bg-white">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="border-black bg-pmi-red">
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id} className="text-white">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
<TableBody>
    {isLoading ? (
        // Tampilkan ini saat data sedang di-fetch
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memuat data pendaftar...</span>
                </div>
            </TableCell>
        </TableRow>
    ) : table.getRowModel().rows?.length ? (
        // Tampilkan data jika sudah ada
        table.getRowModel().rows.map(row => (
            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-neutral-800 hover:bg-neutral-800/50">
                {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
            </TableRow>
        ))
    ) : (
        // Tampilkan ini jika fetch selesai tapi tidak ada data
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                Tidak ada data pendaftar ditemukan.
            </TableCell>
        </TableRow>
    )}
</TableBody>
            </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Total {table.getFilteredRowModel().rows.length} dari {data.length} pendaftar ditampilkan.
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm">Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
        </div>
        
        <PendaftarDetailModal isOpen={isDetailModalOpen} registrationId={selectedRegistrationId} onClose={() => setIsDetailModalOpen(false)} />
        <PaymentProofModal isOpen={isProofModalOpen} onClose={() => setIsProofModalOpen(false)} imageUrl={selectedProofUrl} schoolName={selectedSchoolName} />
    </motion.div>
  );
}