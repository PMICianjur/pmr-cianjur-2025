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
  ColumnFiltersState
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
import { Download, ListFilter, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
                        <Image src={photoUrl} alt={`Foto ${name}`} width={40} height={40} className="object-cover h-full w-full" />
                    ) : (
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

  // Fetch data di sisi client
  React.useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const categoryFilter = columnFilters.find(f => f.id === 'category');
            if (categoryFilter && categoryFilter.value) {
                params.append('category', categoryFilter.value as string);
            }

            const response = await fetch(`/api/admin/all-participants?${params.toString()}`);
            if (!response.ok) throw new Error("Gagal mengambil data dari server");
            const fetchedData = await response.json();
            setData(fetchedData);
        } catch (error: unknown) { // <-- Gunakan 'unknown' untuk tipe yang aman
            let errorMessage = "Gagal memuat data peserta.";
            if (error instanceof Error) {
                errorMessage = error.message; // Gunakan pesan dari error jika ada
            }
            console.error("Fetch Peserta Error:", error); // Log error asli untuk debugging
            toast.error("Gagal memuat data", { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [columnFilters]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
        pagination: { pageSize: 25 } // Tampilkan 25 baris per halaman
    },
    state: { sorting, columnFilters },
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
              placeholder="Cari nama peserta atau sekolah..."
              value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("fullName")?.setFilterValue(event.target.value)}
              className="max-w-sm w-full"
            />
            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto gap-1">
                            <ListFilter className="h-4 w-4" /> Filter Kategori
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter berdasarkan Kategori</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={!table.getColumn("category")?.getFilterValue()} onCheckedChange={() => table.getColumn("category")?.setFilterValue(undefined)}>Semua Kategori</DropdownMenuCheckboxItem>
                        {categories.map(cat => (
                            <DropdownMenuCheckboxItem key={cat} checked={table.getColumn("category")?.getFilterValue() === cat} onCheckedChange={() => table.getColumn("category")?.setFilterValue(cat)}>{cat}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="w-full sm:w-auto gap-1" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Ekspor
                </Button>
            </div>
        </div>
        
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Memuat data peserta...</TableCell></TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.original.no}>
                                {row.getVisibleCells().map(cell => 
                                    <TableCell key={cell.id}>
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

        {/* Paginasi Lengkap */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Total {table.getFilteredRowModel().rows.length} peserta.
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm">Baris per halaman:</span>
                <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => { table.setPageSize(Number(value)) }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 25, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm">
                    Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
      </div>
    </div>
  );
}