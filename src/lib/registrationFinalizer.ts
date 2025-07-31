import prisma from "@/lib/prisma";
import { normalizeSchoolName } from "@/lib/normalization";
import { promises as fs } from 'fs';
import path from 'path';
import { Prisma, Gender } from '@prisma/client';
import { generateAndSaveReceipt } from './receiptGenerator';

// Definisikan tipe data yang diterima agar lebih aman
// Pastikan tipe ini konsisten di seluruh aplikasi
interface SchoolData {
    schoolName: string;
    coachName: string;
    whatsappNumber: string;
    category: 'WIRA' | 'MADYA';
}

interface ParticipantData {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string; // Sesuai kode Anda, jika schema berbeda, sesuaikan
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP": string | number;
    "GENDER": string; // Sesuai kode Anda, bukan GENDER (L/P)
    photoUrl?: string | null;
}

interface CompanionData {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string; // Sesuai kode Anda
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP": string | number;
    "GENDER (L/P)": string; // Sesuai kode Anda
}

interface RegistrationData {
  tempRegId?: string;
  schoolData: SchoolData;
  excelData: {
    participants: ParticipantData[];
    companions: CompanionData[];
  };
  tentChoice: {
    type: 'bawa_sendiri' | 'sewa_panitia';
    capacity: number;
    cost: number;
  };
  kavling: {
    number: number;
    capacity: number;
  } | null;
  costs: {
    participants: number;
    companions: number;
    total: number;
  };
}

interface PaymentDetails {
  method: 'MANUAL' | 'MIDTRANS';
  status: 'SUCCESS' | 'WAITING_CONFIRMATION';
  manualProofPath?: string;
  midtransResponse?: any;
}

/**
 * Fungsi terpusat untuk memfinalisasi pendaftaran.
 */
export async function finalizeRegistration(
  data: RegistrationData,
  orderId: string,
  paymentDetails: PaymentDetails
) {
  const { schoolData, excelData, tentChoice, kavling, costs, tempRegId } = data;
  
  if (!schoolData || !excelData || !tentChoice || !costs) {
    throw new Error(`Data pendaftaran tidak lengkap untuk Order ID ${orderId}.`);
  }
  if (tentChoice.type === 'sewa_panitia' && !kavling) {
     throw new Error(`Data kavling tidak ditemukan untuk pendaftar sewa tenda. Order ID ${orderId}.`);
  }

  const normalizedName = normalizeSchoolName(schoolData.schoolName);
  const schoolSlug = schoolData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
  
  let newRegistrationId: number | null = null;
  
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newSchool = await tx.school.create({ data: { name: schoolData.schoolName, normalizedName, coachName: schoolData.coachName, whatsappNumber: schoolData.whatsappNumber, category: schoolData.category } });

    const newRegistration = await tx.registration.create({
      data: {
        schoolId: newSchool.id,
        tentType: tentChoice.type === 'sewa_panitia' ? 'SEWA_PANITIA' : 'BAWA_SENDIRI',
        tentCapacity: tentChoice.capacity,
        kavlingNumber: kavling?.number,
        participantCount: excelData.participants.length,
        companionCount: excelData.companions.length,
        baseFee: costs.participants + costs.companions,
        tentFee: tentChoice.cost,
        totalFee: costs.total,
      }
    });
    
    newRegistrationId = newRegistration.id;

    if (excelData.participants && excelData.participants.length > 0) {
      const participantCreateData = excelData.participants
        .filter(p => p && p["NAMA LENGKAP"] && p["GENDER"])
        .map((p: ParticipantData) => {
          const genderString = String(p["GENDER"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = p["NO HP"] ? String(p["NO HP"]) : null;
          const photoFilename = p.photoUrl ? path.basename(p.photoUrl) : null;
          return {
            fullName: String(p["NAMA LENGKAP"]),
            birthPlaceDate: String(p["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(p["ALAMAT"] || 'N/A'), // Menggunakan ALAMAT sesuai Excel
            religion: String(p["AGAMA"] || 'N/A'),
            bloodType: String(p["GOL DARAH"] || '-').replace('-', '').trim() || null,
            entryYear: Number(p["TAHUN MASUK"]) || new Date().getFullYear(),
            phoneNumber: phoneNumberValue,
            gender: finalGender,
            photoFilename: photoFilename,
            registrationId: newRegistration.id,
          };
        });
      if (participantCreateData.length > 0) {
          await tx.participant.createMany({ data: participantCreateData, skipDuplicates: true });
      }
    }

    if (excelData.companions && excelData.companions.length > 0) {
       const companionCreateData = excelData.companions
        .filter(c => c && c["NAMA LENGKAP"] && c["GENDER (L/P)"])
        .map((c: CompanionData) => {
          const genderString = String(c["GENDER (L/P)"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = c["NO HP"] ? String(c["NO HP"]) : null;
          return {
            fullName: String(c["NAMA LENGKAP"]),
            birthPlaceDate: String(c["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(c["ALAMAT"] || 'N/A'), // Menggunakan ALAMAT sesuai Excel
            religion: String(c["AGAMA"] || 'N/A'),
            bloodType: String(c["GOL DARAH"] || '-').replace('-', '').trim() || null,
            entryYear: Number(c["TAHUN MASUK"]) || new Date().getFullYear(),
            phoneNumber: phoneNumberValue,
            gender: finalGender,
            registrationId: newRegistration.id,
          };
        });
      if (companionCreateData.length > 0) {
          await tx.companion.createMany({ data: companionCreateData, skipDuplicates: true });
      }
    }

    await tx.payment.create({
      data: {
        id: orderId,
        registrationId: newRegistration.id,
        amount: costs.total,
        method: paymentDetails.method,
        status: paymentDetails.status,
        manualProofPath: paymentDetails.manualProofPath,
        midtransResponse: paymentDetails.midtransResponse,
        confirmedAt: paymentDetails.status === 'SUCCESS' ? new Date() : null,
      }
    });

    if (kavling) {
      await tx.kavlingBooking.update({
        where: {
          kavlingNumber_capacity_category: {
            kavlingNumber: kavling.number,
            capacity: kavling.capacity,
            category: schoolData.category,
          },
        },
        data: { isBooked: true, registrationId: newRegistration.id }
      });
    }
  });

  // Proses file setelah transaksi DB berhasil
  if (newRegistrationId && tempRegId) {
    const newExcelFilename = `${newRegistrationId}-${schoolSlug}.xlsx`;
    const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp', tempRegId);
    const permDir = path.join(process.cwd(), 'public', 'uploads', 'permanent', schoolSlug);
    const tempExcelPath = path.join(tempDir, 'data-peserta.xlsx');
    const permExcelPath = path.join(permDir, newExcelFilename);
    const publicExcelPath = `/uploads/permanent/${schoolSlug}/${newExcelFilename}`;

    try {
      await fs.access(tempDir);
      await fs.mkdir(permDir, { recursive: true });
      try {
        await fs.rename(tempExcelPath, permExcelPath);
        console.log(`Excel file renamed and moved to: ${permExcelPath}`);
        await prisma.registration.update({ where: { id: newRegistrationId }, data: { excelFilePath: publicExcelPath } });
        console.log(`Registration record ${newRegistrationId} updated with Excel file path.`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "An unknown error occurred.";
        console.warn(`Could not rename Excel file for tempRegId ${tempRegId}:`, message);
      }
      const tempPhotosDir = path.join(tempDir, 'photos');
      const permPhotosDir = path.join(permDir, 'photos');
      try {
          await fs.rename(tempPhotosDir, permPhotosDir);
          console.log(`Photos folder moved for tempRegId ${tempRegId}`);
      } catch {
          console.log(`No photos folder found for tempRegId ${tempRegId}, skipping.`);
      }
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Temporary directory ${tempRegId} has been deleted.`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error processing files for tempRegId ${tempRegId}:`, errorMessage);
    }
    
    try {
        console.log("Starting receipt generation process...");
        const receiptPath = await generateAndSaveReceipt(orderId, schoolSlug, normalizedName);
        await prisma.payment.update({ where: { id: orderId }, data: { receiptPath: receiptPath } });
        console.log(`Payment record for ${orderId} updated with receipt path.`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`!!! CRITICAL: Failed to generate receipt for order ID ${orderId}:`, errorMessage);
    }
  }
}