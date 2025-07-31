import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

// Tipe data yang kita harapkan dari setiap baris di Excel
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
        
        // Simpan file temporer ke disk
        const tempDir = path.join('/tmp', tempRegId); // Gunakan /tmp untuk lingkungan serverless
        await fs.mkdir(tempDir, { recursive: true });
        const tempExcelPath = path.join(tempDir, 'data-peserta.xlsx');
        await fs.writeFile(tempExcelPath, fileBuffer);

        const workbook = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workbook.xlsx.load(fileBuffer as any);

        const processedParticipants: ProcessedParticipant[] = [];
        const imageSavePromises: Promise<unknown>[] = [];
        const photosDir = path.join('/tmp', tempRegId, 'photos');
        await fs.mkdir(photosDir, { recursive: true });

        // --- PROSES DATA PESERTA ---
        const participantsSheet = workbook.getWorksheet('PESERTA');
        if (!participantsSheet) throw new Error("Sheet 'Data Peserta' tidak ditemukan.");
        
        const participantHeaderRow = participantsSheet.getRow(6);
        if (!participantHeaderRow.hasValues) throw new Error("Header tidak ditemukan di baris ke-3.");

        let photoColumnIndex = -1;
        participantHeaderRow.eachCell((cell, colNumber) => {
            const cellText = getCellValue(cell);
            if (cellText.toUpperCase().trim() === 'FOTO') photoColumnIndex = colNumber - 1;
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
            if (rowNumber <= 6) return;

            const rawRowData: { [key: string]: string | number | null } = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = getCellValue(participantHeaderRow.getCell(colNumber)).toUpperCase().trim();
                if (header && header !== 'FOTO') {
                    rawRowData[header] = getCellValue(cell);
                }
            });
            
            if (!rawRowData["NAMA LENGKAP"]) return;
            
            let photoUrl: string | null = null;
            const image = participantImageMap.get(rowNumber - 1);

            if (image && image.buffer) {
                const personName = String(rawRowData["NAMA LENGKAP"]);
                const safeFilename = `peserta-${personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${rawRowData["NO"]}.webp`;
                const photoPath = path.join(photosDir, safeFilename);
                const imageNodeBuffer = Buffer.from(image.buffer);
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const savePromise = sharp(imageNodeBuffer as any)
                    .resize(300, 400, { fit: 'cover' })
                    .webp({ quality: 80 })
                    .toFile(photoPath);
                imageSavePromises.push(savePromise);
                photoUrl = `/uploads/temp/${tempRegId}/photos/${safeFilename}`; // Ini hanya untuk referensi, file sebenarnya ada di /tmp
            }
            
            processedParticipants.push({
                "NO": Number(rawRowData["NO"]) || 0,
                "NAMA LENGKAP": String(rawRowData["NAMA LENGKAP"] || ""),
                "TEMPAT, TANGGAL LAHIR": String(rawRowData["TEMPAT, TANGGAL LAHIR"] || ""),
                "ALAMAT LENGKAP": String(rawRowData["ALAMAT LENGKAP"] || ""),
                "AGAMA": String(rawRowData["AGAMA"] || ""),
                "GOLONGAN DARAH": String(rawRowData["GOLONGAN DARAH"] || ""),
                "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                "GENDER": String(rawRowData["GENDER"] || ""),
                "NO HP": rawRowData["NO HP"] ? String(rawRowData["NO HP"]) : undefined,
                photoUrl: photoUrl,
            });
        });

       const processedCompanions: CompanionRow[] = []; // Gunakan `let` di sini
const companionsSheet = workbook.getWorksheet('PESERTA');
if (companionsSheet) {
    const companionHeaderRow = companionsSheet.getRow(6);
    if (companionHeaderRow.hasValues) {
        companionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber <= 3) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawRowData: { [key: string]: any } = {}; // Nonaktifkan ESLint untuk baris ini
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = getCellValue(companionHeaderRow.getCell(colNumber)).toUpperCase().trim();
                if (header) rawRowData[header] = getCellValue(cell);
            });

            if (rawRowData["NAMA LENGKAP"]) {
                processedCompanions.push(rawRowData as CompanionRow);
            }
        });
    }
}
        
        await Promise.all(imageSavePromises);
        
        if (processedParticipants.length === 0) {
            throw new Error("Tidak ada data peserta valid yang ditemukan di file.");
        }
        
        processedParticipants.sort((a, b) => a.NO - b.NO);
        processedCompanions.sort((a, b) => a.NO - b.NO);

        return NextResponse.json({ 
            message: "File berhasil diproses.",
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