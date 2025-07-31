// src/types/index.ts
import { z } from 'zod';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { Prisma } from "@prisma/client";
// --- TIPE DATA DARI EXCEL ---
// Ini adalah satu-satunya tempat kita mendefinisikan ini.
// Perhatikan "NO HP" diubah menjadi `number | string` agar fleksibel.

export const SchoolDataSchema = z.object({
  schoolName: z.string().min(5, "Nama sekolah minimal 5 karakter"),
  coachName: z.string().min(3, "Nama pembina minimal 3 karakter"),
  whatsappNumber: z.string().min(10, "Nomor WhatsApp tidak valid").max(15),
  category: z.enum(["WIRA", "MADYA"], {
    required_error: "Anda harus memilih kategori sekolah",
  }),
});

export interface ParticipantExcelRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP"?: number | string;
    "GENDER (L/P)": string;
    photoUrl?: string | null;
}

export interface CompanionExcelRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP"?: number | string;
    "GENDER (L/P)": string;
}



export interface ProcessedParticipant extends ParticipantExcelRow {
    photoUrl: string | null;
}
export type SchoolData = z.infer<typeof SchoolDataSchema>;

export interface RegistrationData {
  tempRegId?: string | null;
  schoolData: SchoolData | null;
  excelData: {
    participants: ParticipantExcelRow[];
    companions: CompanionExcelRow[];
  } | null;
  tentChoice: {
    type: 'bawa_sendiri' | 'sewa_panitia';
    capacity: number;
    cost: number;
  } | null;
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

// Tipe lain yang berguna
export interface FileWithPreview extends File {
  preview: string;
}

export interface SerializableFile {
    name: string;
    type: string;
    size: number;
}

export interface PaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  manualProofPath?: string;
}

export const registrationDetailQueryArgs = {
  include: {
    school: true,
    participants: {
      orderBy: { id: 'asc' } as const
    },
    companions: {
      orderBy: { id: 'asc' } as const
    },
    payment: true,
  },
};

// Ekspor tipe payload dari sini
export type RegistrationDetailPayload = Prisma.RegistrationGetPayload<typeof registrationDetailQueryArgs>;