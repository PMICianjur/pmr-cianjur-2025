import { NextRequest, NextResponse } from "next/server";
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Menggunakan Supabase Storage

const BUCKET_NAME = 'pendaftaran-files'; // Pastikan nama ini sama dengan di Supabase

// Tipe data yang diharapkan dari setiap baris di Excel
// Pastikan ini cocok 100% dengan header di file Excel Anda
interface ParticipantRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT LENGKAP": string;
    "AGAMA": string;
    "GOLONGAN DARAH": string;
    "TAHUN MASUK": number;
    "GENDER": string;
    "NO HP"?: string | number;
}

interface CompanionRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT LENGKAP": string;
    "AGAMA": string;
    "GOLONGAN DARAH": string;
    "TAHUN MASUK": number;
    "GENDER (L/P)": string;
    "NO HP"?: string | number;
}

// Tipe data final yang akan kita kirim kembali ke frontend
interface ProcessedParticipant extends ParticipantRow {
    photoUrl: string | null;
}

// Tipe untuk data mentah yang dibaca dari sel, sebelum divalidasi
type RawRowData = Record<string, ExcelJS.CellValue>;

// Fungsi helper yang robust untuk mendapatkan nilai teks dari sel
const getCellValue = (cell: ExcelJS.Cell): string => {
    const cellValue = cell.value;
    if (cellValue === null || cellValue === undefined) return "";
    if (typeof cellValue === 'object' && 'richText' in cellValue && cellValue.richText) {
        const richTextValue = cellValue.richText as ExcelJS.RichText[];
        if (Array.isArray(richTextValue)) {
            return richTextValue.map((rtFragment: ExcelJS.RichText) => rtFragment.text).join('');
        }
    }
    if (typeof cellValue === 'object' && 'result' in cellValue) {
        return String(cellValue.result || "");
    }
    if (cellValue instanceof Date) {
        return cellValue.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return cellValue.toString();
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const tempRegId = formData.get('tempRegId') as string | null;
        const file = formData.get('file') as File | null;

        if (!tempRegId || !file) {
            return NextResponse.json({ message: "Data tidak lengkap." }, { status: 400 });
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer); 

        // Tidak lagi menulis ke disk, langsung proses dari buffer
        console.log(`[UPLOAD-EXCEL] Processing file from buffer for tempRegId: ${tempRegId}`);

        const workbook = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workbook.xlsx.load(fileBuffer as any);

        const processedParticipants: ProcessedParticipant[] = [];
        const imageUploadPromises: Promise<unknown>[] = [];

        // --- PROSES DATA PESERTA ---
        const participantsSheet = workbook.getWorksheet('Data Peserta');
        if (!participantsSheet) throw new Error("Sheet 'Data Peserta' tidak ditemukan.");
        
        const participantHeaderRow = participantsSheet.getRow(3);
        if (!participantHeaderRow.hasValues) throw new Error("Header tidak ditemukan di baris ke-3.");

        let photoColumnIndex = -1;
        participantHeaderRow.eachCell((cell, colNumber) => {
            if (getCellValue(cell).toUpperCase().trim() === 'FOTO') photoColumnIndex = colNumber - 1;
        });

        const participantImageMap = new Map<number, ExcelJS.Image>();
        participantsSheet.getImages().forEach(image => {
            if (photoColumnIndex !== -1 && Math.floor(image.range.tl.col) === photoColumnIndex) {
                const row = Math.floor(image.range.tl.row);
                const imageIdAsNumber = parseInt(image.imageId, 10);
                const imgData = workbook.getImage(imageIdAsNumber);
                if (imgData) participantImageMap.set(row, imgData);
            }
        });

        participantsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber <= 3) return;

            const rawRowData: RawRowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = getCellValue(participantHeaderRow.getCell(colNumber)).toUpperCase().trim();
                if (header) rawRowData[header] = cell.value;
            });
            
            if (!rawRowData["NAMA LENGKAP"]) return;
            
            let photoUrl: string | null = null;
            const image = participantImageMap.get(rowNumber - 1);

            if (image && image.buffer) {
                const personName = String(rawRowData["NAMA LENGKAP"]);
                const photoPath = `uploads/temp/${tempRegId}/photos/peserta-${personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${rawRowData["NO"]}.webp`;
                
                const uploadPromise = sharp(Buffer.from(image.buffer))
                    .resize(300, 400, { fit: 'cover' })
                    .webp({ quality: 80 })
                    .toBuffer()
                    .then(optimizedBuffer => 
                        supabaseAdmin.storage
                            .from(BUCKET_NAME)
                            .upload(photoPath, optimizedBuffer, { contentType: 'image/webp', upsert: true })
                    );
                imageUploadPromises.push(uploadPromise);
                const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(photoPath);
                photoUrl = publicUrl;
            }
            
            processedParticipants.push({
                "NO": Number(rawRowData["NO"]) || 0,
                "NAMA LENGKAP": getCellValue({ value: rawRowData["NAMA LENGKAP"] } as ExcelJS.Cell),
                "TEMPAT, TANGGAL LAHIR": getCellValue({ value: rawRowData["TEMPAT, TANGGAL LAHIR"] } as ExcelJS.Cell),
                "ALAMAT LENGKAP": getCellValue({ value: rawRowData["ALAMAT LENGKAP"] } as ExcelJS.Cell),
                "AGAMA": getCellValue({ value: rawRowData["AGAMA"] } as ExcelJS.Cell),
                "GOLONGAN DARAH": getCellValue({ value: rawRowData["GOLONGAN DARAH"] } as ExcelJS.Cell),
                "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                "GENDER": getCellValue({ value: rawRowData["GENDER"] } as ExcelJS.Cell),
                "NO HP": rawRowData["NO HP"] ? String(rawRowData["NO HP"]) : undefined,
                photoUrl: photoUrl,
            });
        });

        // --- PROSES DATA PENDAMPING ---
        let processedCompanions: CompanionRow[] = [];
        const companionsSheet = workbook.getWorksheet('Data Pendamping');
        if (companionsSheet) {
            const companionList: CompanionRow[] = [];
            const companionHeaderRow = companionsSheet.getRow(3);
            if (companionHeaderRow.hasValues) {
                companionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber <= 3) return;
                    const rawRowData: RawRowData = {};
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const header = getCellValue(companionHeaderRow.getCell(colNumber)).toUpperCase().trim();
                        if (header) rawRowData[header] = cell.value;
                    });

                    if (rawRowData["NAMA LENGKAP"]) {
                        companionList.push({
                            "NO": Number(rawRowData["NO"]) || 0,
                            "NAMA LENGKAP": getCellValue({ value: rawRowData["NAMA LENGKAP"] } as ExcelJS.Cell),
                            "TEMPAT, TANGGAL LAHIR": getCellValue({ value: rawRowData["TEMPAT, TANGGAL LAHIR"] } as ExcelJS.Cell),
                            "ALAMAT LENGKAP": getCellValue({ value: rawRowData["ALAMAT LENGKAP"] } as ExcelJS.Cell),
                            "AGAMA": getCellValue({ value: rawRowData["AGAMA"] } as ExcelJS.Cell),
                            "GOLONGAN DARAH": getCellValue({ value: rawRowData["GOLONGAN DARAH"] } as ExcelJS.Cell),
                            "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                            "GENDER (L/P)": getCellValue({ value: rawRowData["GENDER (L/P)"] } as ExcelJS.Cell),
                            "NO HP": rawRowData["NO HP"] ? String(rawRowData["NO HP"]) : undefined,
                        });
                    }
                });
            }
            processedCompanions = companionList;
        }
        
        // Tunggu semua proses unggah gambar selesai
        const uploadResults = await Promise.all(imageUploadPromises);
        uploadResults.forEach(result => {
            if (
        result && 
        typeof result === 'object' && 
        'error' in result && 
        result.error
    ) {
        // Di dalam blok ini, TypeScript sekarang "tahu" bahwa result.error ada.
        console.error("A Supabase photo upload failed in background:", result.error);
    }
});
        
        if (processedParticipants.length === 0) {
            throw new Error("Tidak ada data peserta valid yang ditemukan di file.");
        }
        
        processedParticipants.sort((a, b) => a.NO - b.NO);
        processedCompanions.sort((a, b) => a.NO - b.NO);

        return NextResponse.json({ 
            message: "File berhasil diproses dan diunggah.",
            data: { participants: processedParticipants, companions: processedCompanions }
        }, { status: 200 });

    } catch (error: unknown) {
        let errorMessage = "Gagal memproses file.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Excel processing error:", error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}