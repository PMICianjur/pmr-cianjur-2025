import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Di masa depan, Anda bisa menambahkan logika untuk memeriksa sesi admin di sini

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { paymentId } = body;

        if (!paymentId || typeof paymentId !== 'string') {
            return NextResponse.json({ message: "ID Pembayaran tidak valid." }, { status: 400 });
        }

        const paymentToConfirm = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!paymentToConfirm) {
            throw new Error("Pembayaran tidak ditemukan.");
        }

        if (paymentToConfirm.status !== 'WAITING_CONFIRMATION') {
            throw new Error(`Pembayaran ini tidak bisa dikonfirmasi (status saat ini: ${paymentToConfirm.status}).`);
        }

        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'SUCCESS',
                confirmedAt: new Date(), // Set tanggal konfirmasi
            }
        });

        return NextResponse.json({
            message: "Pembayaran berhasil dikonfirmasi.",
            payment: updatedPayment
        });

    } catch (error: unknown) { // 1. Gunakan `unknown`
    let errorMessage = "Gagal mengkonfirmasi pembayaran.";
    // 2. Lakukan type guard
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Error confirming payment:", error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
}
}