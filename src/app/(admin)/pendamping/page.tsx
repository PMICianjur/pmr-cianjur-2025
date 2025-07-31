// src/app/(admin)/peserta/page.tsx
import { PendampingTableWrapper } from "@/components/admin/PendampingTableWrapper";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function PesertaPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold tracking-tight">Data Seluruh Pendamping</h1>
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }>
                {/* Komponen Wrapper akan melakukan fetch data di sisi client */}
                <PendampingTableWrapper />
            </Suspense>
        </div>
    );
}