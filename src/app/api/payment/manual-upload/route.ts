// src/app/api/payment/manual-upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateSafeOrderId } from "@/lib/orderId";
import { finalizeRegistration } from "@/lib/registrationFinalizer"; // Impor fungsi finalizer
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET_NAME = 'pendaftaranfiles';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const registrationDataString = formData.get('registrationData') as string | null;
    const paymentProof = formData.get('paymentProof') as File | null;

    if (!registrationDataString || !paymentProof) {
      return NextResponse.json({ message: "Data pendaftaran atau bukti pembayaran tidak ditemukan.", }, { status: 400 });
    }

    const registrationData = JSON.parse(registrationDataString);
    const { schoolData } = registrationData;
    
    // Generate Order ID yang unik dan URL-safe
    // Fungsi ini sekarang async, jadi perlu di-await
    const orderId = await generateSafeOrderId(schoolData.schoolName);
    const schoolSlug = schoolData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);

    // --- LOGIKA BARU: UPLOAD BUKTI PEMBAYARAN KE SUPABASE ---

    // 1. Tentukan path permanen di Supabase Storage
    const proofFilename = `bukti-${orderId}.webp`;
    const permanentProofPath = `uploads/permanent/${schoolSlug}/payment/${proofFilename}`;

    // 2. Baca file dan kompres dengan Sharp
    const fileBuffer = Buffer.from(await paymentProof.arrayBuffer());
    const optimizedBuffer = await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    // 3. Unggah buffer yang sudah dioptimalkan ke Supabase
    const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(permanentProofPath, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true, // Timpa jika ada
        });

    if (uploadError) {
        console.error("Supabase payment proof upload error:", uploadError);
        throw new Error(`Gagal mengunggah bukti pembayaran: ${uploadError.message}`);
    }

    // 4. Dapatkan URL publik dari file yang baru diunggah
    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(permanentProofPath);
    const publicProofUrl = publicUrl;

    console.log(`Manual proof uploaded to Supabase: ${publicProofUrl}`);
    
    // --- AKHIR LOGIKA BARU ---


    // Panggil fungsi terpusat untuk finalisasi pendaftaran
    await finalizeRegistration(
      registrationData,
      orderId,
      {
        method: 'MANUAL',
        status: 'WAITING_CONFIRMATION',
        manualProofPath: publicProofUrl, // Kirim URL publik, bukan path lokal
      }
    );

    return NextResponse.json({
      message: 'Upload bukti pembayaran berhasil. Pendaftaran Anda sedang menunggu konfirmasi dari panitia.',
      orderId: orderId,
    }, { status: 201 });

  } catch (error: unknown) {
    let errorMessage = "Gagal mengupload bukti pembayaran.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('Manual payment upload error:', error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}