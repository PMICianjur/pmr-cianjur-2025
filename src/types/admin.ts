// src/types/admin.ts

// Kita definisikan ulang tipe Enum sebagai string literal.
// Ini memutuskan hubungan dengan `@prisma/client` sepenuhnya.
export type SchoolCategory = "WIRA" | "MADYA";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "WAITING_CONFIRMATION";
export type PaymentMethod = "MANUAL" | "MIDTRANS";

export interface DashboardData {
  stats: {
    totalPendaftar: number;
    totalPeserta: number;
    totalPendamping: number;
    totalPemasukan: number;
    menungguKonfirmasi: number;
    totalTendaSewa: number;
  };
  chartData: {
    date: string;
    "Total Pemasukan": number;
  }[];
  recentRegistrations: {
    id: number;
    school: { name: string };
    payment: { status: string | null; amount: number } | null;
  }[];
}

export type FormattedRegistration = {
    id: number;
    normalizedName: string;
    coachName: string;
    whatsappNumber: string;
    category: SchoolCategory;
    status: PaymentStatus;
    method: PaymentMethod | 'UNKNOWN'; // Tambahkan UNKNOWN sebagai fallback
    totalFee: number;
    participantCount: number;
    companionCount: number;
    excelFilePath?: string | null;
    createdAt: string;
     paymentId?: string | null;
    manualProofPath?: string | null;
};

export interface FormattedParticipant {
    no: number;
    schoolName: string;
    normalizedName: string;
    category: string;
    fullName: string;
    photoUrl: string | null;
    birthPlaceDate: string;
    address: string;
    religion: string;
    bloodType: string | null;
    entryYear: number;
    phoneNumber: string | null;
    gender: string;
}

export interface FormattedCompanion {
    no: number;
    schoolName: string;
    normalizedName: string;
    category: string;
    fullName: string;
    birthPlaceDate: string;
    address: string;
    religion: string;
    bloodType: string | null;
    entryYear: number;
    phoneNumber: string | null;
    gender: string;
}