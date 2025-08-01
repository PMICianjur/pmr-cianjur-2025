import { NextRequest, NextResponse } from "next/server";
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Menggunakan Supabase Storage

const BUCKET_NAME = 'pendaftaranfiles'; // Pastikan nama ini sama dengan di Supabase

// Tipe data yang diharapkan dari setiap baris di Excel
// Pastikan ini cocok 100% dengan header di file Excel Anda
interface ParticipantRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "GENDER (L/P)": string;
    "NO HP"?: string | number;
}

interface CompanionRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
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
        
        const fileBuffer = Buffer.from(await file.arrayBuffer()); 
        const workbook = new ExcelJS.Workbook();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await workbook.xlsx.load(fileBuffer as any);
        

        // --- PROSES DATA PESERTA ---
        const participantsSheet = workbook.getWorksheet('PESERTA');
        if (!participantsSheet) throw new Error("Sheet 'Data Peserta' tidak ditemukan.");
        
        const participantHeaderRow = participantsSheet.getRow(6);
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

const participantPromises = participantsSheet.getRows(7, participantsSheet.rowCount - 6)!.map(async (row) => {
    const rawRowData: { [key: string]: ExcelJS.CellValue } = {}; // <-- UBAH DI SINI
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = getCellValue(participantHeaderRow.getCell(colNumber)).toUpperCase().trim();
        if (header) {
            rawRowData[header] = cell.value; // `cell.value` memiliki tipe `CellValue`
        }
    });
            
            if (!rawRowData["NAMA LENGKAP"]) return null;
            
            let photoUrl: string | null = null;
            const image = participantImageMap.get(row.number - 1);
            if (image && image.buffer) {
                const personName = String(rawRowData["NAMA LENGKAP"]);
                const photoPath = `uploads/temp/${tempRegId}/photos/peserta-${personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${rawRowData["NO"]}.webp`;
                
                const optimizedBuffer = await sharp(Buffer.from(image.buffer)).resize(300, 400, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
                
                const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(photoPath, optimizedBuffer, { contentType: 'image/webp', upsert: true });
                
                if (uploadError) {
                    console.error(`Supabase photo upload error for ${photoPath}:`, uploadError);
                } else {
                    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(photoPath);
                    photoUrl = publicUrl;
                }
            }
            
            return {
                "NO": Number(rawRowData["NO"]) || 0,
                "NAMA LENGKAP": String(rawRowData["NAMA LENGKAP"] || ""),
                "TEMPAT, TANGGAL LAHIR": String(rawRowData["TEMPAT, TANGGAL LAHIR"] || ""),
                "ALAMAT": String(rawRowData["ALAMAT"] || ""),
                "AGAMA": String(rawRowData["AGAMA"] || ""),
                "GOL DARAH": String(rawRowData["GOL DARAH"] || ""),
                "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                "GENDER (L/P)": String(rawRowData["GENDER (L/P)"] || ""),
                "NO HP": rawRowData["NO HP"] ? String(rawRowData["NO HP"]) : undefined,
                photoUrl: photoUrl,
            };
        });

        const resolvedParticipants = (await Promise.all(participantPromises)).filter(Boolean) as ProcessedParticipant[];
        // --- PROSES DATA PENDAMPING ---
let processedCompanions: CompanionRow[] = [];
        const companionsSheet = workbook.getWorksheet('PENDAMPING');
        if (companionsSheet) {
            const companionList: CompanionRow[] = [];
            const companionHeaderRow = companionsSheet.getRow(6);
            if (companionHeaderRow.hasValues) {
                companionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber <= 6) return;
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
                            "ALAMAT": getCellValue({ value: rawRowData["ALAMAT"] } as ExcelJS.Cell),
                            "AGAMA": getCellValue({ value: rawRowData["AGAMA"] } as ExcelJS.Cell),
                            "GOL DARAH": getCellValue({ value: rawRowData["GOL DARAH"] } as ExcelJS.Cell),
                            "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                            "GENDER (L/P)": getCellValue({ value: rawRowData["GENDER (L/P)"] } as ExcelJS.Cell),
                            "NO HP": rawRowData["NO HP"] ? String(rawRowData["NO HP"]) : undefined,
                        });
                    }
                });
            }
            processedCompanions = companionList;
        }

        if (resolvedParticipants.length === 0) {
            throw new Error("Tidak ada data peserta valid yang ditemukan di file.");
        }
        
        resolvedParticipants.sort((a, b) => a.NO - b.NO);
        processedCompanions.sort((a, b) => a.NO - b.NO);

        return NextResponse.json({ 
            message: "File berhasil diproses dan diunggah.",
            data: { participants: resolvedParticipants, companions: processedCompanions }
        }, { status: 200 });

    } catch (error: unknown) {
        let errorMessage = "Gagal memproses file.";
        if (error instanceof Error) errorMessage = error.message;
        console.error("Excel processing error:", error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
} 
            