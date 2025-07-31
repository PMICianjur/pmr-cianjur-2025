// src/app/api/admin/confirm-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from 'next/cache'; // Untuk me-refresh data di Server Components

export async function POST(req: NextRequest) {
    // Di aplikasi produksi, Anda HARUS menambahkan autentikasi di sini
    // untuk memastikan hanya admin yang bisa mengakses endpoint ini.
    // Contoh: const session = await getServerSession(); if (!session || session.user.role !== 'ADMIN') { ... }
    
    try {
        const body = await req.json();
        const { paymentId } = body;

        if (!paymentId || typeof paymentId !== 'string') {
            return NextResponse.json({ message: "Payment ID tidak valid atau tidak ditemukan." }, { status: 400 });
        }

        // Cari pembayaran yang sesuai
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return NextResponse.json({ message: "Data pembayaran tidak ditemukan." }, { status: 404 });
        }

        // Pastikan kita hanya mengkonfirmasi pembayaran yang statusnya benar
        if (payment.status !== 'WAITING_CONFIRMATION') {
            return NextResponse.json({ message: `Pembayaran ini tidak bisa dikonfirmasi (status saat ini: ${payment.status}).` }, { status: 409 }); // 409 Conflict
        }

        // Update status pembayaran menjadi SUCCESS
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'SUCCESS',
                confirmedAt: new Date(), // Tandai waktu konfirmasi
            },
        });

        // --- PENTING: Me-refresh data di halaman pendaftar ---
        // Ini akan memberitahu Next.js untuk mengambil ulang data di halaman '/pendaftar'
        // saat navigasi berikutnya, sehingga tabel akan menampilkan data terbaru.
        revalidatePath('/(admin)/pendaftar', 'page');
        revalidatePath('/(admin)/dashboard', 'page'); // Refresh dashboard juga

        return NextResponse.json({
            message: "Pembayaran berhasil dikonfirmasi.",
            payment: updatedPayment,
        });

    } catch (error) {
        console.error("Error confirming payment:", error);
        return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}