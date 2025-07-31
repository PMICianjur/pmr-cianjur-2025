// src/app/api/payment/manual-upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateSafeOrderId } from "@/lib/orderId";
import { finalizeRegistration } from "@/lib/registrationFinalizer"; // Impor fungsi finalizer

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
    
    const orderId = await generateSafeOrderId(schoolData.schoolName);
    const schoolSlug = schoolData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);

    // Proses dan simpan bukti transfer
    const permanentProofDir = path.join(process.cwd(), 'public', 'uploads', 'permanent', schoolSlug, 'payment');
    await fs.mkdir(permanentProofDir, { recursive: true });
    
    const proofFilename = `bukti-${orderId.split('-')[0]}.webp`;
    const permanentProofPath = path.join(permanentProofDir, proofFilename);
    const publicProofPath = `/uploads/permanent/${schoolSlug}/payment/${proofFilename}`;
    const fileBuffer = Buffer.from(await paymentProof.arrayBuffer());

    await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(permanentProofPath);

    // Panggil fungsi terpusat untuk finalisasi pendaftaran
    // Fungsi ini SEKARANG bertanggung jawab penuh atas pemindahan file excel dan foto
    await finalizeRegistration(
      registrationData,
      orderId,
      {
        method: 'MANUAL',
        status: 'WAITING_CONFIRMATION',
        manualProofPath: publicProofPath,
      }
    );

    return NextResponse.json({
      message: 'Upload bukti pembayaran berhasil. Pendaftaran Anda sedang menunggu konfirmasi dari panitia.',
      orderId: orderId,
    }, { status: 201 });

  } catch (error) {
    console.error('Manual payment upload error:', error);
    return NextResponse.json({ message: "Gagal mengupload bukti pembayaran." }, { status: 500 });
  }
}