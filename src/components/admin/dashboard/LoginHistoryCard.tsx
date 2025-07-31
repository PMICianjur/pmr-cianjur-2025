"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

// Tipe data yang diterima oleh komponen ini
type LoginHistoryEntry = {
    id: number;
    loginAt: string; // ISO string
    admin: {
        name: string;
        username: string;
    }
};

interface LoginHistoryCardProps {
    history: LoginHistoryEntry[];
}

export function LoginHistoryCard({ history }: LoginHistoryCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }} // Beri sedikit delay
        >
            <Card className="h-full border-black bg-pmi-red text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-white" />
                        <span>Riwayat Login Terbaru</span>
                    </CardTitle>
                    <CardDescription>5 aktivitas login terakhir ke sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {history.length > 0 ? (
                            history.map((entry) => (
                                <div key={entry.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-white text-pmi-red">
                                            {entry.admin.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="text-white">{entry.admin.name}</span>
                                            <span className="text-muted-foreground"> (@{entry.admin.username})</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(entry.loginAt).toLocaleString('id-ID', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Belum ada riwayat login yang tercatat.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}