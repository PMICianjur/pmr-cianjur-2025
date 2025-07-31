import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { generateSafeOrderId } from "@/lib/orderId";
import { z } from "zod";
import { BIAYA_PESERTA, BIAYA_PENDAMPING } from '@/config/fees';
import { Prisma } from "@prisma/client";
// Zod schema untuk memvalidasi body request yang masuk dari frontend.
const CreateTransactionSchema = z.object({
    tempRegId: z.string().uuid("tempRegId harus berupa UUID yang valid."),
    schoolData: z.object({
        schoolName: z.string().min(1, "Nama sekolah tidak boleh kosong."),
        coachName: z.string().min(1),
        whatsappNumber: z.string().min(1),
    }),
    costs: z.object({
        total: z.number().min(1, "Total biaya harus lebih dari 0."),
    }),
    excelData: z.object({ 
        participants: z.array(z.any()),
        companions: z.array(z.any()) 
    }),
    tentChoice: z.object({
        type: z.string(),
        cost: z.number().gte(0),
        capacity: z.number().gte(0)
    }),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validasi data yang masuk menggunakan Zod
        const validation = CreateTransactionSchema.safeParse(body);
        if (!validation.success) {
            console.error("Validation failed in create-transaction:", validation.error.flatten());
            return NextResponse.json({ 
                message: "Data permintaan tidak valid atau tidak lengkap.", 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }
        
        const transactionData = validation.data;
        
        const { tempRegId, schoolData, costs, excelData, tentChoice } = transactionData;
        
        // 2. Generate Order ID yang unik dan URL-safe
         const orderId = await generateSafeOrderId(schoolData.schoolName);
        
        console.log(`--- [Create Transaction] Processing for tempRegId: ${tempRegId} ---`);
        console.log(`[Create Transaction] Generated Order ID: ${orderId}`);
        const dataToStore = {
            ...body,
            payment: {
                orderId: orderId,
            }
        };
        // 3. Update record di TemporaryRegistration untuk menyisipkan orderId
        await prisma.temporaryRegistration.update({
            where: { id: tempRegId },
            data: { 
                data: dataToStore as Prisma.InputJsonValue,
                status: 'PROCESSING_PAYMENT'
            }
        });

        console.log(`[Create Transaction] Successfully updated TemporaryRegistration record with Order ID.`);

        // 4. Siapkan rincian item untuk dikirim ke Midtrans
        const item_details = [
            { id: 'FEE_PESERTA', price: BIAYA_PESERTA, quantity: excelData.participants.length, name: `Biaya Pendaftaran ${excelData.participants.length} Peserta` },
            { id: 'FEE_PENDAMPING', price: BIAYA_PENDAMPING, quantity: excelData.companions.length, name: `Biaya Pendaftaran ${excelData.companions.length} Pendamping` },
        ];

        if (tentChoice.cost > 0) {
            item_details.push({ id: 'FEE_TENDA', price: tentChoice.cost, quantity: 1, name: `Sewa Tenda (Kapasitas ${tentChoice.capacity})` });
        }
        
        // 5. Siapkan parameter lengkap untuk Midtrans Snap API
        const parameter = {
            order_id: orderId,
            transaction_details: { order_id: orderId, gross_amount: costs.total },
            customer_details: { first_name: schoolData.coachName, phone: schoolData.whatsappNumber },
            item_details: item_details,
            callbacks: { finish: `${process.env.APP_URL}/status` },
        };
        
        console.log("[Create Transaction] Creating Midtrans transaction with parameters:", JSON.stringify(parameter, null, 2));

        // 6. Buat token transaksi dari Midtrans
        const token = await snap.createTransactionToken(parameter);
        
        console.log(`[Create Transaction] Midtrans token generated successfully for Order ID: ${orderId}`);

        // 7. Kembalikan token dan orderId ke frontend
        return NextResponse.json({ token, orderId });

    } catch (error) { // Hapus `: any`
    console.error("--- ERROR in /api/payment/create-transaction ---");
    console.error(error);
    
    // Pola penanganan error yang type-safe
    let errorMessage = "Terjadi kesalahan internal pada server.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json({ 
        message: "Gagal membuat transaksi Midtrans", 
        error: errorMessage 
    }, { status: 500 });
}
}