// src/types/receipt.ts

// Tipe ini mendefinisikan semua data yang dibutuhkan untuk mencetak kwitansi
export interface ReceiptData {
  schoolData: {
    coachName: string;
    normalizedName: string;
    name: string;
    // Tambahkan properti lain jika perlu, misal: coachName
  };
  excelData: {
    participants: { length: number }; // Hanya butuh panjang array
    companions: { length: number };
  };
  tentChoice: {
    type: string; // 'SEWA_PANITIA' atau 'BAWA_SENDIRI'
    capacity: number;
    cost: number;
  };
  costs: {
    participants: number;
    companions: number;
    total: number;
  };
  kavling: {
    number: number;
    capacity: number;
  } | null;
  // Properti lain yang mungkin Anda butuhkan bisa ditambahkan di sini
}