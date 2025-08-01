import prisma from "@/lib/prisma";
import { normalizeSchoolName } from "@/lib/normalization";
import { supabaseAdmin } from './supabaseAdmin';
import { Prisma, Gender, SchoolCategory, PaymentMethod, PaymentStatus, TentType } from '@prisma/client';
import { generateAndSaveReceipt } from './receiptGenerator';
import path from 'path';

const BUCKET_NAME = 'pendaftaranfiles';

// --- DEFINISI TIPE DATA YANG SESUAI DENGAN EXCEL DAN STATE ---
interface SchoolData {
    schoolName: string;
    coachName: string;
    whatsappNumber: string;
    category: SchoolCategory;
}

// Tipe ini cocok dengan kolom di sheet "Data Peserta" & "Data Pendamping"
interface ParticipantExcelRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string; // Sesuai header Excel Anda
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP"?: number | string;
    "GENDER (L/P)": string; // Sesuai header Excel Anda
    photoUrl?: string | null;
}

interface CompanionExcelRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string; // Sesuai header Excel Anda
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP"?: number | string;
    "GENDER (L/P)": string; // Sesuai header Excel Anda
}

interface RegistrationData {
  tempRegId?: string;
  schoolData: SchoolData;
  excelData: {
    participants: ParticipantExcelRow[];
    companions: CompanionExcelRow[];
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
  method: PaymentMethod;
  status: PaymentStatus;
  manualProofPath?: string;
  midtransResponse?: Record<string, unknown>;
}


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
  
  let newRegistrationId: number | null = null;
  
  // 1. Lakukan semua operasi database dalam satu transaksi
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
        .filter(p => p && p["NAMA LENGKAP"] && p["GENDER (L/P)"])
        .map((p: ParticipantExcelRow) => {
          const genderString = String(p["GENDER (L/P)"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = p["NO HP"] ? String(p["NO HP"]) : null;
          const photoFilename = p.photoUrl ? p.photoUrl : null;
          return {
            fullName: String(p["NAMA LENGKAP"]),
            birthPlaceDate: String(p["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(p["ALAMAT"] || 'N/A'), // Membaca dari "ALAMAT"
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
        .map((c: CompanionExcelRow) => {
          const genderString = String(c["GENDER (L/P)"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = c["NO HP"] ? String(c["NO HP"]) : null;
          return {
            fullName: String(c["NAMA LENGKAP"]),
            birthPlaceDate: String(c["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(c["ALAMAT"] || 'N/A'), // Membaca dari "ALAMAT"
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

    await tx.payment.create({ data: { id: orderId, registrationId: newRegistration.id, amount: costs.total, method: paymentDetails.method, status: paymentDetails.status, manualProofPath: paymentDetails.manualProofPath, confirmedAt: paymentDetails.status === 'SUCCESS' ? new Date() : null } });

    if (kavling) {
      await tx.kavlingBooking.update({ where: { kavlingNumber_capacity_category: { kavlingNumber: kavling.number, capacity: kavling.capacity, category: schoolData.category } }, data: { isBooked: true, registrationId: newRegistration.id } });
    }
  });

  // 2. Setelah transaksi DB berhasil, proses file di Supabase Storage
  if (newRegistrationId && tempRegId) {
    const schoolSlug = schoolData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
    const tempFolderPath = `uploads/temp/${tempRegId}`;
    const permanentFolderPath = `uploads/permanent/${schoolSlug}`;
    
    // Proses File Excel
    try {
const newExcelFilename = `${newRegistrationId}-${schoolSlug}.xlsx`;
  const fromExcelPath = `${tempFolderPath}/data-peserta.xlsx`;
  const toExcelPath = `${permanentFolderPath}/${newExcelFilename}`;

  console.log(`[FINALIZE] Attempting to move Excel from: ${fromExcelPath} to: ${toExcelPath}`);
  
  const { error: moveExcelError } = await supabaseAdmin.storage.from(BUCKET_NAME).move(fromExcelPath, toExcelPath);

  if (moveExcelError) {
      console.error(`[FINALIZE] ERROR moving Excel file:`, moveExcelError.message);
      // JANGAN LANJUTKAN JIKA MOVE GAGAL, tapi jangan hentikan seluruh proses
  } else {
      console.log(`[FINALIZE] SUCCESS: Excel file moved.`);
      // Dapatkan URL publik dari LOKASI BARU
      const { data: { publicUrl: excelPublicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(toExcelPath);
      
      console.log(`[FINALIZE] Updating DB with Excel path: ${excelPublicUrl}`);
      try {
          await prisma.registration.update({ 
              where: { id: newRegistrationId }, 
              data: { excelFilePath: excelPublicUrl } 
          });
          console.log(`[FINALIZE] SUCCESS: DB updated with excelFilePath.`);
      } catch (dbError) {
          console.error(`[FINALIZE] ERROR updating excelFilePath in DB:`, dbError);
      }
  }
    } catch (error: unknown) {
        console.error("Error processing Excel file:", error instanceof Error ? error.message : "Unknown error");
    }

    // Proses Foto Peserta
    try {
        const participantsInDB = await prisma.participant.findMany({ where: { registrationId: newRegistrationId }, select: { id: true, photoFilename: true } });
        const photoUpdatePromises = participantsInDB
            .filter(p => p.photoFilename && p.photoFilename.includes(`/temp/${tempRegId}/`))
            .map(async (participant) => {
                const tempPhotoUrl = new URL(participant.photoFilename!);
                const fromPhotoPath = tempPhotoUrl.pathname.substring(tempPhotoUrl.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1); // Dapatkan path setelah nama bucket
                
                const tempPhotoFilename = path.basename(fromPhotoPath);
                const toPhotoPath = `${permanentFolderPath}/photos/${tempPhotoFilename}`;
                
                const { error: movePhotoError } = await supabaseAdmin.storage.from(BUCKET_NAME).move(fromPhotoPath, toPhotoPath);
                
                if (movePhotoError && movePhotoError.message !== 'The resource was not found') {
                    console.error(`Failed to move photo ${fromPhotoPath}:`, movePhotoError.message);
                    return null;
                }
                
                if (!movePhotoError) {
                    const { data: { publicUrl: photoPublicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(toPhotoPath);
                    return prisma.participant.update({ where: { id: participant.id }, data: { photoFilename: photoPublicUrl } });
                }
                return null;
            });
            
        await Promise.all(photoUpdatePromises);
        console.log("All participant photo paths updated to permanent URLs.");
    } catch (error: unknown) {
        console.error("Error processing photo files:", error instanceof Error ? error.message : "Unknown error");
    }

    // Hapus Folder Temporer
    try {
        const { data: filesToRemove, error: listError } = await supabaseAdmin.storage.from(BUCKET_NAME).list(tempFolderPath, { limit: 1000 });
        if (listError) throw listError;
        if (filesToRemove && filesToRemove.length > 0) {
            const pathsToRemove = filesToRemove.map(f => `${tempFolderPath}/${f.name}`);
            pathsToRemove.push(`${tempFolderPath}/data-peserta.xlsx`); // Hapus file excel juga
            await supabaseAdmin.storage.from(BUCKET_NAME).remove(pathsToRemove);
            console.log(`Supabase temp files for ${tempRegId} cleaned up.`);
        }
    } catch (error: unknown) {
        console.error("Error cleaning up temp folder:", error instanceof Error ? error.message : "Unknown error");
    }
    
    // 3. Buat dan simpan kwitansi PDF
    try {
        console.log("Starting receipt generation process...");
        const receiptPath = await generateAndSaveReceipt(orderId, schoolSlug, normalizedName);
        await prisma.payment.update({ where: { id: orderId }, data: { receiptPath: receiptPath } });
        console.log(`Payment record for ${orderId} updated with receipt path.`);
    } catch (receiptError: unknown) {
        const errorMessage = receiptError instanceof Error ? receiptError.message : "An unknown error occurred.";
        console.error(`!!! CRITICAL: Failed to generate receipt for order ID ${orderId}:`, errorMessage);
    }
  }
}