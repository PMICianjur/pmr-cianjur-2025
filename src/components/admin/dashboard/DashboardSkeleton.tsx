export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <div className="h-10 w-1/3 bg-neutral-800 rounded-md animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-[126px] rounded-xl bg-neutral-800/50 animate-pulse"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 h-[450px] rounded-xl bg-neutral-800/50 animate-pulse"></div>
                <div className="lg:col-span-2 h-[450px] rounded-xl bg-neutral-800/50 animate-pulse"></div>
            </div>
        </div>
    );
}