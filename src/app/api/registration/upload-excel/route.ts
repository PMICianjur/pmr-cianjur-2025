import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

// ... (Interface ParticipantRow, CompanionRow, ProcessedParticipant) ...
interface ParticipantRow {
    "NO": number;
    "NAMA LENGKAP": string;
    "TEMPAT, TANGGAL LAHIR": string;
    "ALAMAT": string;
    "AGAMA": string;
    "GOL DARAH": string;
    "TAHUN MASUK": number;
    "NO HP": string;
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
    "NO HP": string;
    "GENDER (L/P)": string;
}
interface ProcessedParticipant extends ParticipantRow {
    photoUrl: string | null;
}

const getCellValue = (cell: ExcelJS.Cell): string => {
    // Ambil nilai mentah dari sel
    const cellValue = cell.value;
    
    // 1. Tangani kasus sel kosong (null atau undefined)
    if (cellValue === null || cellValue === undefined) {
        return "";
    }

    // 2. Tangani kasus Rich Text (teks dengan format seperti bold, italic, dll.)
    // Objeknya akan terlihat seperti { richText: [...] }
    if (typeof cellValue === 'object' && 'richText' in cellValue && cellValue.richText) {
        // `cellValue.richText` adalah array dari fragmen teks
        const richTextValue = cellValue.richText as ExcelJS.RichText[];
        if (Array.isArray(richTextValue)) {
            // Gabungkan semua fragmen teks menjadi satu string
            return richTextValue.map((rtFragment: ExcelJS.RichText) => rtFragment.text).join('');
        }
    }
    
    // 3. Tangani kasus sel yang berisi hasil dari sebuah formula
    // Objeknya akan terlihat seperti { formula: '...', result: '...' }
    if (typeof cellValue === 'object' && 'result' in cellValue) {
        // Ambil nilai `result`, bukan `formula`-nya
        return String(cellValue.result || "");
    }

    // 4. Tangani kasus sel yang berisi tanggal (objek Date)
    if (cellValue instanceof Date) {
        // Format tanggal menjadi string YYYY-MM-DD atau format lain yang Anda inginkan.
        // `toLocaleDateString` adalah opsi yang bagus jika Anda ingin format lokal.
        return cellValue.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    // 5. Untuk semua tipe data primitif lainnya (string, number, boolean)
    // Gunakan `toString()` sebagai cara aman untuk mengonversinya.
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
            // Tulis file buffer ke disk
            await fs.writeFile(tempExcelPath, fileBuffer);
            console.log(`[API /upload-excel] SUCCESS: Temporary Excel file saved to: ${tempExcelPath}`);
        } catch (writeError) {
            // Jika penulisan gagal, log error dan hentikan proses
            console.error(`[API /upload-excel] FAILED to write temporary file:`, writeError);
            throw new Error("Gagal menyimpan file temporer di server. Periksa izin folder.");
        }
        const workbook = new ExcelJS.Workbook();

        // --- SOLUSI FINAL #1: Gunakan `as any` dan nonaktifkan ESLint untuk baris ini ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workbook.xlsx.load(fileBuffer as any);

        const processedParticipants: ProcessedParticipant[] = [];
        const imageSavePromises: Promise<sharp.OutputInfo>[] = [];
        const validationErrors: string[] = [];
        const photosDir = path.join(process.cwd(), 'public', 'uploads', 'temp', tempRegId, 'photos');
        await fs.mkdir(photosDir, { recursive: true });

        // --- PROSES DATA PESERTA ---
        const participantsSheet = workbook.getWorksheet('PESERTA');
        if (!participantsSheet) throw new Error("Sheet 'Data Peserta' tidak ditemukan.");
        
        const participantHeaderRow = participantsSheet.getRow(6);
        if (!participantHeaderRow.hasValues) throw new Error("Header tidak ditemukan di baris ke-3.");

        let photoColumnIndex = -1;
        participantHeaderRow.eachCell((cell: ExcelJS.Cell, colNumber: number) => { // Tipe eksplisit
            const cellText = getCellValue(cell);
            if (cellText.toUpperCase().trim() === 'FOTO') photoColumnIndex = colNumber - 1;
        });

        const participantImageMap = new Map<number, ExcelJS.Image>();
        participantsSheet.getImages().forEach(image => {
            if (Math.floor(image.range.tl.col) === photoColumnIndex) {
                const row = Math.floor(image.range.tl.row);
                const imageIdAsNumber = parseInt(image.imageId, 10);
                const imgData = workbook.getImage(imageIdAsNumber);
                if (imgData) participantImageMap.set(row, imgData);
            }
        });

        participantsSheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row, rowNumber: number) => { // Tipe eksplisit
            if (rowNumber <= 6) return;

            const rawRowData: Record<string, string> = {};
            row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => { // Tipe eksplisit
                const header = getCellValue(participantHeaderRow.getCell(colNumber)).toUpperCase().trim();
                if (header && header.toUpperCase().trim() !== 'FOTO') {
                    rawRowData[header] = getCellValue(cell);
                }
            });
            
            if (!rawRowData["NAMA LENGKAP"]) return;
            if (!rawRowData["NAMA LENGKAP"]) {
                validationErrors.push(`Sheet Peserta, Baris ${rowNumber}: Kolom 'NAMA LENGKAP' tidak boleh kosong.`);
            }
            if (!rawRowData["TEMPAT, TANGGAL LAHIR"]) {
                validationErrors.push(`Sheet Peserta, Baris ${rowNumber}: Kolom 'TEMPAT, TANGGAL LAHIR' tidak boleh kosong.`);
            }
            if (!rawRowData["ALAMAT"]) { // Menyesuaikan dengan schema Anda
                validationErrors.push(`Sheet Peserta, Baris ${rowNumber}: Kolom 'ALAMAT' tidak boleh kosong.`);
            }
            if (!rawRowData["FOTO"]) { // Menyesuaikan dengan schema Anda
                validationErrors.push(`Sheet Peserta, Baris ${rowNumber}: Kolom 'FOTO' tidak boleh kosong.`);
            }
            
            let photoUrl: string | null = null;
            const image = participantImageMap.get(rowNumber - 1);

            if (image && image.buffer) {
                const personName = rawRowData["NAMA LENGKAP"];
                const safeFilename = `peserta-${personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${rawRowData["NO"]}.webp`;
                const photoPath = path.join(photosDir, safeFilename);
                const imageNodeBuffer = Buffer.from(image.buffer);
                 const savePromise = sharp(imageNodeBuffer as unknown as Buffer) // Gunakan double casting
                .resize(300, 400, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(photoPath);
            imageSavePromises.push(savePromise);
                photoUrl = `/uploads/temp/${tempRegId}/photos/${safeFilename}`;
            }
            
            const participant: ProcessedParticipant = {
                "NO": Number(rawRowData["NO"]) || 0,
                "NAMA LENGKAP": String(rawRowData["NAMA LENGKAP"] || ""),
                "TEMPAT, TANGGAL LAHIR": String(rawRowData["TEMPAT, TANGGAL LAHIR"] || ""),
                "ALAMAT": String(rawRowData["ALAMAT"] || ""),
                "AGAMA": String(rawRowData["AGAMA"] || ""),
                "GOL DARAH": String(rawRowData["GOL DARAH"] || ""),
                "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                "NO HP": String(rawRowData["NO HP"] || ""),
                "GENDER (L/P)": String(rawRowData["GENDER (L/P)"] || ""),
                photoUrl: photoUrl,
            };
            processedParticipants.push(participant);
        });

        // --- PROSES DATA PENDAMPING ---
        const processedCompanions: CompanionRow[] = [];
        const companionsSheet = workbook.getWorksheet('PENDAMPING');
        if (companionsSheet) {
            const companionHeaderRow = companionsSheet.getRow(6);
            if (companionHeaderRow.hasValues) {
                companionsSheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row, rowNumber: number) => { // Tipe eksplisit
                    if (rowNumber <= 6) return;
                    const rawRowData: Record<string, string> = {};
                    row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => { // Tipe eksplisit
                        const header = getCellValue(companionHeaderRow.getCell(colNumber)).toUpperCase().trim();
                        if (header) rawRowData[header] = getCellValue(cell);
                    });

                    if (!rawRowData["NAMA LENGKAP"]) return;
                     if (!rawRowData["NAMA LENGKAP"]) {
                        validationErrors.push(`Sheet Pendamping, Baris ${rowNumber}: Kolom 'NAMA LENGKAP' tidak boleh kosong.`);
                    }
                    if (!rawRowData["TEMPAT, TANGGAL LAHIR"]) {
                        validationErrors.push(`Sheet Pendamping, Baris ${rowNumber}: Kolom 'TEMPAT, TANGGAL LAHIR' tidak boleh kosong.`);
                    }
                    if (!rawRowData["ALAMAT LENGKAP"]) { // Menyesuaikan dengan schema Anda
                        validationErrors.push(`Sheet Pendamping, Baris ${rowNumber}: Kolom 'ALAMAT' tidak boleh kosong.`);
                    }

                    const companion: CompanionRow = {
                        "NO": Number(rawRowData["NO"]) || 0,
                        "NAMA LENGKAP": String(rawRowData["NAMA LENGKAP"] || ""),
                        "TEMPAT, TANGGAL LAHIR": String(rawRowData["TEMPAT, TANGGAL LAHIR"] || ""),
                        "ALAMAT": String(rawRowData["ALAMAT"] || ""),
                        "AGAMA": String(rawRowData["AGAMA"] || ""),
                        "GOL DARAH": String(rawRowData["GOL DARAH"] || ""),
                        "TAHUN MASUK": Number(rawRowData["TAHUN MASUK"]) || 0,
                        "NO HP": String(rawRowData["NO HP"] || ""),
                        "GENDER (L/P)": String(rawRowData["GENDER (L/P)"] || ""),
                    };
                    processedCompanions.push(companion);
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

    } catch (error) { // Blok catch yang type-safe
        let errorMessage = "Gagal memproses file.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Excel processing error:", error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}