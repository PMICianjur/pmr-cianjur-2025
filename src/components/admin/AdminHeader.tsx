"use client"; // Tandai sebagai Client Component

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react"; // Impor useSession dan signOut
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // Impor Skeleton untuk loading

export function AdminHeader() {
    const pathname = usePathname();
    // Ganti judul statis dengan judul yang lebih baik dari path
    const title = pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard';
    
    // Gunakan hook useSession untuk mendapatkan data sesi
    const { data: session, status } = useSession();

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' }); // Arahkan ke halaman login setelah logout
    };

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-8 border-b border-black bg-white">
            <motion.h1 
                key={title} // Animasi setiap kali judul berubah
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold capitalize text-black"
            >
                Data {title}
            </motion.h1>

            <div>
                {/* Tampilkan skeleton saat sesi sedang dimuat */}
                {status === "loading" && (
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                )}

                {/* Tampilkan dropdown jika sesi sudah terautentikasi */}
                {status === "authenticated" && session.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-auto px-4 py-6 flex items-center gap-3 border-2 text-pmi-red border-pmi-red hover:bg-pmi-red hover:text-white">
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{session.user.name}</p>
                                    <p className="text-xs">{(session.user).role}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full flex items-center justify-center">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-700 text-white">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {(session.user).username}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-700" />
                            <DropdownMenuItem onSelect={handleLogout} className="text-red-500 focus:bg-red-900/50 focus:text-red-400">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Keluar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}