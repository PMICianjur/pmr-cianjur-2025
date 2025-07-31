// src/app/api/registration/upload-excel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

// Definisikan tipe data yang kita harapkan dari setiap baris di Excel
// Pastikan ini cocok 100% dengan header di file Excel
interface ParticipantRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP": string | number;
    "GENDER (L/P)": string;
}

interface CompanionRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP": string | number;
    "GENDER (L/P)": string;
}

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
        
        const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp', tempRegId);
        await fs.mkdir(tempDir, { recursive: true });
        const tempExcelPath = path.join(tempDir, 'data-peserta.xlsx');

        try {
            await fs.writeFile(tempExcelPath, fileBuffer);
            console.log(`[API /upload-excel] SUCCESS: Temporary Excel file saved to: ${tempExcelPath}`);
        } catch (writeError) {
            console.error(`[API /upload-excel] FAILED to write temporary file:`, writeError);
            throw new Error("Gagal menyimpan file temporer di server. Periksa izin folder.");
        }

        const workbook = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workbook.xlsx.load(fileBuffer as any);

        const processedParticipants: ProcessedParticipant[] = [];
        const imageSavePromises: Promise<any>[] = [];
        const photosDir = path.join(process.cwd(), 'public', 'uploads', 'temp', tempRegId, 'photos');
        await fs.mkdir(photosDir, { recursive: true });

        // --- PROSES DATA PESERTA ---
        const participantsSheet = workbook.getWorksheet('Data Peserta'); // Pastikan nama sheet benar
        if (!participantsSheet) throw new Error("Sheet 'Data Peserta' tidak ditemukan.");
        
        const participantHeaderRow = participantsSheet.getRow(3); // Asumsi header di baris 3
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
            if (rowNumber <= 3) return;

            const rawRowData: any = {};
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
                const personName = rawRowData["NAMA LENGKAP"];
                const safeFilename = `peserta-${personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${rawRowData["NO"]}.webp`;
                const photoPath = path.join(photosDir, safeFilename);
                const imageNodeBuffer = Buffer.from(image.buffer);
                const savePromise = sharp(imageNodeBuffer as any).resize(300, 400, { fit: 'cover' }).webp({ quality: 80 }).toFile(photoPath);
                imageSavePromises.push(savePromise);
                photoUrl = `/uploads/temp/${tempRegId}/photos/${safeFilename}`;
            }
            
            // Map ke tipe yang kuat
            processedParticipants.push({ ...rawRowData, photoUrl });
        });

        // --- PROSES DATA PENDAMPING ---
        let processedCompanions: CompanionRow[] = [];
        const companionsSheet = workbook.getWorksheet('Data Pendamping'); // Pastikan nama sheet benar
        if (companionsSheet) {
            const companionHeaderRow = companionsSheet.getRow(3); // Asumsi header juga di baris 3
            if (companionHeaderRow.hasValues) {
                companionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber <= 3) return;
                    const rawRowData: any = {};
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

    } catch (error) {
        let errorMessage = "Gagal memproses file.";
        if (error instanceof Error) { errorMessage = error.message; }
        console.error("Excel processing error:", error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}