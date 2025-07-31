"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrencyForTooltip = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatCurrencyForAxis = (amount: number) => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)} jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)} rb`;
    return `Rp ${amount}`;
};

interface ChartData {
    date: string;
    "Total Pemasukan": number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrencyForAxis} />
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        <Tooltip
            contentStyle={{
                backgroundColor: '#FFFFFF',
                backdropFilter: 'blur(5px)',
                border: '1px solid #FF0000',
                borderRadius: '0.5rem',
                color: '#FF0000',
            }}
            formatter={(value: number) => [formatCurrencyForTooltip(value), 'Pemasukan']}
            labelStyle={{ fontWeight: 'bold' }}
        />
        <Area type="monotone" dataKey="Total Pemasukan" stroke="#EF4444" fillOpacity={1} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}