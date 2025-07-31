import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/RevenueChart"

export default async function RevenueChartWrapper() {
    const successfulRegistrations = await prisma.registration.findMany({ 
        where: { payment: { status: 'SUCCESS' } }, 
        orderBy: { createdAt: 'asc' }, 
        include: { payment: true } 
    });

    let cumulativeRevenue = 0;
    const chartData = successfulRegistrations.map(reg => {
        cumulativeRevenue += reg.payment?.amount || 0;
        return {
            date: reg.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            "Total Pemasukan": cumulativeRevenue,
        };
    });
    
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Pertumbuhan Pemasukan</CardTitle>
                <CardDescription>Akumulasi pendapatan dari pembayaran yang telah berhasil.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <RevenueChart data={chartData} />
            </CardContent>
        </Card>
    );
}

export function ChartSkeleton() {
    return (
        <div className="h-[450px] w-full rounded-xl animate-pulse"></div>
    );
}