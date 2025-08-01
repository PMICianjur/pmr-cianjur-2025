// src/app/(admin)/pendaftar/page.tsx
import { PendaftarTableWrapper } from "@/components/admin/PendaftarTableWrapper";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Halaman ini sekarang hanya menjadi kerangka
export default function PendaftarPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        }>
            <PendaftarTableWrapper />
        </Suspense>
    );
}