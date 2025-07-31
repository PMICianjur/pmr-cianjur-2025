"use client";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
    Home, 
    Users, 
    Tent, 
    UserSquare,
    PanelLeft, // Mengganti Bars3Icon agar konsisten dengan Lucide
    Search,    // Mengganti MagnifyingGlassIcon agar konsisten dengan Lucide
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Definisikan props untuk kejelasan
interface CommandMenuProps {
    toggleSidebar: () => void;
}

export function CommandMenu({ toggleSidebar }: CommandMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Efek untuk menambahkan event listener shortcut keyboard (Ctrl+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Cek jika tombol 'k' ditekan bersamaan dengan Ctrl (Windows/Linux) atau Cmd (Mac)
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault(); // Mencegah aksi default browser (misalnya, membuka pencarian)
                setIsOpen((open) => !open);
            }
        };
        
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Fungsi helper untuk menjalankan aksi dan menutup dialog
    const runCommand = (command: () => void) => {
        setIsOpen(false);
        command();
    };

    return (
        <>
            {/* --- Command Bar yang Terlihat di Bawah Halaman --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div 
                    className="flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-lg rounded-full shadow-lg border border-border transition-all hover:shadow-xl"
                >
                    <Button 
                        onClick={toggleSidebar} 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle Sidebar"
                    >
                        <PanelLeft className="h-5 w-5"/>
                    </Button>
                    <Button 
                        onClick={() => setIsOpen(true)} 
                        variant="ghost" 
                        className="rounded-full h-10 px-4 flex gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <Search className="h-5 w-5"/>
                        <span className="hidden sm:inline">Cari Cepat...</span>
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>
                </div>
            </div>

            {/* --- Dialog Pencarian Cepat (Command Palette) --- */}
            <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
                <CommandInput placeholder="Ketik perintah atau cari navigasi..." />
                <CommandList>
                    <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
                    
                    <CommandGroup heading="Navigasi Utama">
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/pendaftar'))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Pendaftar</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/peserta'))}>
                            <UserSquare className="mr-2 h-4 w-4" />
                            <span>Database Peserta</span>
                        </CommandItem>
                         <CommandItem onSelect={() => runCommand(() => router.push('/akomodasi'))}>
                            <Tent className="mr-2 h-4 w-4" />
                            <span>Akomodasi</span>
                        </CommandItem>
                    </CommandGroup>
                    
                    <CommandSeparator />
                    
                    <CommandGroup heading="Aksi Cepat">
                        <CommandItem onSelect={() => runCommand(() => toast.info("Fitur ekspor akan segera tersedia!"))}>
                            {/* Ganti dengan ikon yang sesuai, misal Download */}
                            <span>Ekspor Semua Data Pendaftar</span>
                        </CommandItem>
                         <CommandItem onSelect={() => runCommand(() => alert("Membuka pengaturan..."))}>
                            {/* Ganti dengan ikon yang sesuai, misal Settings */}
                            <span>Pengaturan Akun</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}