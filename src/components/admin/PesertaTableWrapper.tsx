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
  getFacetedRowModel,
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Download, ListFilter, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { FormattedParticipant } from "@/types/admin";
import Image from "next/image";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { SchoolCategory } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Definisikan kolom-kolom untuk tabel secara lengkap
export const columns: ColumnDef<FormattedParticipant>[] = [
    { accessorKey: "no", header: "No." },
    {
        accessorKey: "photoUrl",
        header: "Foto",
        cell: ({ row }) => {
            const photoUrl = row.original.photoUrl;
            const name = row.original.fullName;
            return (
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {photoUrl ? (
                        <Image src={photoUrl} alt={`Foto ${name}`} width={40} height={40} className="object-cover h-full w-full" unoptimized />
                    ) 
                   : (
                        <User size={20} className="text-gray-400" />
                    )}
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    { accessorKey: "fullName", header: "Nama Lengkap" },
    { accessorKey: "schoolName", header: "Sekolah", enableSorting: true },
    { accessorKey: "category", header: "Kategori" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "birthPlaceDate", header: "TTL" },
    { accessorKey: "address", header: "Alamat" },
    { accessorKey: "religion", header: "Agama" },
    { accessorKey: "bloodType", header: "Gol. Darah" },
    { accessorKey: "entryYear", header: "Tahun Masuk" },
    { accessorKey: "phoneNumber", header: "No. HP" },
];

export function PesertaTableWrapper() {
  const [data, setData] = React.useState<FormattedParticipant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(''); // State baru untuk pencarian global
  // Fetch data di sisi client
  React.useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Kita tidak perlu lagi mengirim filter kategori ke API,
            // karena TanStack Table bisa memfilternya di sisi klien dengan sangat cepat.
            const response = await fetch(`/api/admin/all-participants`);
            if (!response.ok) throw new Error("Gagal mengambil data dari server");
            const fetchedData = await response.json();
            setData(fetchedData);
        } catch (error: unknown) {
            let errorMessage = "Gagal memuat data peserta.";
            if (error instanceof Error) errorMessage = error.message;
            toast.error("Gagal memuat data", { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []); // Hapus dependensi columnFilters agar tidak fetch ulang saat filter

 const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter, // Hubungkan state global filter
    getFacetedRowModel: getFacetedRowModel(), // Aktifkan model untuk global filter
    initialState: { pagination: { pageSize: 25 } },
    state: { sorting, columnFilters, globalFilter },
  });
  
  const handleExport = () => {
    toast.info("Mempersiapkan file Excel untuk diunduh...");
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
        const reg = row.original;
        // Buat objek baru secara manual hanya dengan data yang kita inginkan
        return {
            'No': reg.no,
            'Nama Lengkap': reg.fullName,
            'Sekolah': reg.schoolName,
            'Kategori': reg.category,
            'Gender': reg.gender,
            'TTL': reg.birthPlaceDate,
            'Alamat': reg.address,
            'Agama': reg.religion,
            'Gol. Darah': reg.bloodType,
            'Tahun Masuk': reg.entryYear,
            'No. HP': reg.phoneNumber,
        };
    });

    if (dataToExport.length === 0) {
        toast.error("Tidak ada data untuk diekspor.");
        return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");
    XLSX.writeFile(workbook, `Data-Peserta-PMR-2025-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("File Excel berhasil diunduh!");
};

  const categories: SchoolCategory[] = ["WIRA", "MADYA"];

 return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Input
              placeholder="Cari nama, sekolah..."
              value={globalFilter ?? ""} // Gunakan state globalFilter
              onChange={(event) => setGlobalFilter(event.target.value)} // Update state globalFilter
              className="max-w-sm w-full bg-transparent border-neutral-700 focus:ring-pmi-red"
            />
            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto gap-1 border-neutral-700 hover:bg-neutral-800 hover:text-white">
                            <ListFilter className="h-4 w-4" /> Filter Kategori
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-700 text-white">
                        <DropdownMenuLabel>Filter berdasarkan Kategori</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-700" />
                        <DropdownMenuCheckboxItem checked={!table.getColumn("category")?.getFilterValue()} onCheckedChange={() => table.getColumn("category")?.setFilterValue(undefined)}>Semua Kategori</DropdownMenuCheckboxItem>
                        {categories.map(cat => (
                            <DropdownMenuCheckboxItem key={cat} checked={table.getColumn("category")?.getFilterValue() === cat} onCheckedChange={() => table.getColumn("category")?.setFilterValue(cat)}>{cat}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="w-full sm:w-auto gap-1 border-neutral-700 hover:bg-neutral-800 hover:text-white" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Ekspor
                </Button>
            </div>
        </div>
        
        <div  className="rounded-lg border border-black">
            <Table>
                <TableHeader className="bg-pmi-red border  border-black">
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="border border-black">
                            {headerGroup.headers.map(header => (
                                 <TableHead key={header.id} className="border text-center font-bold text-white border-black">
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody className="border border-black">
                    {isLoading ? (
                        <TableRow><TableCell colSpan={columns.length} className="h-48 text-center"><div className="flex justify-center items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /><span>Memuat data peserta...</span></div></TableCell></TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.original.no} className="border-black border">
                                {row.getVisibleCells().map(cell => 
                                    <TableCell key={cell.id} className="border-black border">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada data peserta yang cocok.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Total {table.getFilteredRowModel().rows.length} dari {data.length} peserta.
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm">Baris/hal:</span>
                <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => { table.setPageSize(Number(value)) }}>
                    <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
                    <SelectContent side="top">{[10, 25, 50, 100].map(pageSize => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm">
                    Hal {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
      </div>
    </div>
  );
}