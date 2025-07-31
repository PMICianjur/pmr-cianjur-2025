"use client";

// Komponen kerangka (skeleton) untuk satu kartu.
// Ini adalah blok bangunan dasar untuk skeleton dashboard.
const CardSkeleton = ({ height = "h-[140px]" }: { height?: string }) => (
    <div className={`w-full rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse ${height}`}></div>
);

/**
 * Komponen DashboardSkeleton menyediakan UI kerangka lengkap untuk seluruh halaman dashboard.
 * Ini akan ditampilkan oleh React Suspense saat data di server sedang diambil.
 * Strukturnya meniru layout akhir dari dashboard yang sebenarnya.
 */
export const DashboardSkeleton = () => (
    <div className="flex flex-col gap-8">
        {/* Skeleton untuk header/judul halaman */}
        <div className="space-y-2">
            <div className="h-9 bg-gray-300 dark:bg-zinc-700 rounded-md w-1/3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded-md w-1/2 animate-pulse"></div>
        </div>
        
        {/* Skeleton untuk grid kartu statistik */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
        
        {/* Skeleton untuk grid utama (grafik dan tabel) */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2">
                <CardSkeleton height="h-[400px]" />
            </div>
            <div>
                <CardSkeleton height="h-[400px]" />
            </div>
        </div>
    </div>
);