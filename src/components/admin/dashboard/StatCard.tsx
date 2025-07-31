"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountUp from "react-countup";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    unit?: string;
    isCurrency?: boolean;
    special?: boolean;
    index: number;
}

export function StatCard({ title, value, icon: Icon, unit, isCurrency, special, index }: StatCardProps) {
    const numericValue = isCurrency ? Number(value) : parseInt(String(value));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(220, 38, 38, 0.2)" }}
        >
            <Card className={`border-red-600 bg-pmi-red hover:border-black transition-all ${special ? 'bg-pmi-red border-red-600' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
                    <Icon className={`h-5 w-5 ${special ? 'text-white' : 'text-white'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {isCurrency ? (
                            <>
                                Rp <CountUp end={numericValue} separator="." duration={1.5} />
                            </>
                        ) : (
                            <CountUp end={numericValue} duration={1.5} />
                        )}
                        {unit && <span className="text-lg font-medium text-white ml-2">{unit}</span>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}