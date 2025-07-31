import prisma from "@/lib/prisma";
import { normalizeSchoolName } from "@/lib/normalization";
import { promises as fs } from 'fs';
import path from 'path';
import { Gender } from '@prisma/client';

// Impor semua tipe data dari file terpusat
import { 
    type RegistrationData, 
    type PaymentDetails,
    type ParticipantExcelRow,
    type CompanionExcelRow
} from '@/types/registration';

/**
 * Fungsi terpusat untuk memfinalisasi pendaftaran.
 * Memindahkan data dari state sementara ke tabel database permanen dan mengatur file.
 */
export async function finalizeRegistration(
  data: RegistrationData,
  orderId: string,
  paymentDetails: PaymentDetails
) {
  const { schoolData, excelData, tentChoice, kavling, costs, tempRegId } = data;

  // Validasi data penting sebelum memulai transaksi
  if (!schoolData || !excelData || !tentChoice || !costs) {
    throw new Error(`Data pendaftaran tidak lengkap untuk Order ID ${orderId}. Finalisasi dibatalkan.`);
  }
  if (tentChoice.type === 'sewa_panitia' && !kavling) {
     throw new Error(`Data kavling tidak ditemukan untuk pendaftar sewa tenda. Order ID ${orderId}.`);
  }

  const normalizedName = normalizeSchoolName(schoolData.schoolName);
  const schoolSlug = schoolData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
  
  let newRegistrationId: number | null = null;
  
  // Lakukan semua operasi database dalam satu transaksi untuk memastikan integritas data
  await prisma.$transaction(async (tx) => {
    // 1. Buat data Sekolah
    const newSchool = await tx.school.create({
      data: {
        name: schoolData.schoolName,
        normalizedName: normalizedName,
        coachName: schoolData.coachName,
        whatsappNumber: schoolData.whatsappNumber,
        category: schoolData.category,
      }
    });

    // 2. Buat data Registrasi
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
        // excelFilePath akan di-update nanti setelah file di-rename
      }
    });
    
    newRegistrationId = newRegistration.id;

    // 3. Buat data Peserta
    if (excelData.participants && excelData.participants.length > 0) {
      const participantCreateData = excelData.participants
        .filter(p => p && p["NAMA LENGKAP"] && p["GENDER (L/P)"]) // Filter baris yang tidak valid
        .map((p: ParticipantExcelRow) => {
          const genderString = String(p["GENDER (L/P)"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = p["NO HP"] ? String(p["NO HP"]) : null;
          const photoFilename = p.photoUrl ? path.basename(p.photoUrl) : null;
          
          return {
            fullName: String(p["NAMA LENGKAP"]),
            birthPlaceDate: String(p["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(p["ALAMAT"] || 'N/A'),
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
          await tx.participant.createMany({ 
              data: participantCreateData,
              skipDuplicates: true 
          });
      }
    }

    // 4. Buat data Pendamping
    if (excelData.companions && excelData.companions.length > 0) {
       const companionCreateData = excelData.companions
        .filter(c => c && c["NAMA LENGKAP"] && c["GENDER (L/P)"]) // Filter baris yang tidak valid
        .map((c: CompanionExcelRow) => {
          const genderString = String(c["GENDER (L/P)"] || '').trim().toUpperCase();
          const finalGender: Gender = genderString.startsWith('L') ? 'LAKI_LAKI' : 'PEREMPUAN';
          const phoneNumberValue = c["NO HP"] ? String(c["NO HP"]) : null;
          
          return {
            fullName: String(c["NAMA LENGKAP"]),
            birthPlaceDate: String(c["TEMPAT, TANGGAL LAHIR"] || 'N/A'),
            address: String(c["ALAMAT"] || 'N/A'),
            religion: String(c["AGAMA"] || 'N/A'),
            bloodType: String(c["GOL DARAH"] || '-').replace('-', '').trim() || null,
            entryYear: Number(c["TAHUN MASUK"]) || new Date().getFullYear(),
            phoneNumber: phoneNumberValue,
            gender: finalGender,
            registrationId: newRegistration.id,
          };
        });
      if (companionCreateData.length > 0) {
          await tx.companion.createMany({ 
              data: companionCreateData,
              skipDuplicates: true
          });
      }
    }

    // 5. Buat data Pembayaran
    await tx.payment.create({
      data: {
        id: orderId,
        registrationId: newRegistration.id,
        amount: costs.total,
        method: paymentDetails.method,
        status: paymentDetails.status,
        manualProofPath: paymentDetails.manualProofPath,
        confirmedAt: paymentDetails.status === 'SUCCESS' ? new Date() : null,
      }
    });

    // 6. Tandai Kavling sudah dipesan (jika ada)
    if (kavling) {
      await tx.kavlingBooking.update({
        where: {
          kavlingNumber_capacity_category: {
            kavlingNumber: kavling.number,
            capacity: kavling.capacity,
            category: schoolData.category,
          },
        },
        data: { 
          isBooked: true, 
          registrationId: newRegistration.id 
        }
      });
    }
  });

  // Setelah transaksi database berhasil, proses file
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

      // Pindahkan dan rename file Excel
      try {
        await fs.rename(tempExcelPath, permExcelPath);
        console.log(`Excel file renamed and moved to: ${permExcelPath}`);

        // Update record Registration dengan path file Excel yang baru
        await prisma.registration.update({
            where: { id: newRegistrationId },
            data: { excelFilePath: publicExcelPath }
        });
        console.log(`Registration record ${newRegistrationId} updated with Excel file path.`);
      } catch (e: unknown) { // Gunakan 'unknown'
        if (e instanceof Error) {
            console.warn(`Could not rename Excel file for tempRegId ${tempRegId}:`, e.message);
        } else {
            console.warn(`Could not rename Excel file for tempRegId ${tempRegId}: An unknown error occurred.`);
        }
      }

      // Pindahkan folder foto
      const tempPhotosDir = path.join(tempDir, 'photos');
      const permPhotosDir = path.join(permDir, 'photos');
      try {
          await fs.rename(tempPhotosDir, permPhotosDir);
          console.log(`Photos folder moved for tempRegId ${tempRegId}`);
      } catch {
          console.log(`No photos folder found for tempRegId ${tempRegId}, skipping.`);
      }
      
      // Hapus folder temporer yang asli
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Temporary directory ${tempRegId} has been deleted.`);

    } catch (error: unknown) { // Gunakan 'unknown'
        let errorMessage = "An unknown error occurred while processing files.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`Error processing files for tempRegId ${tempRegId} after DB transaction:`, errorMessage);
    }
  }
}

export { RegistrationData };
