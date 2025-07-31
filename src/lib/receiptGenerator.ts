// src/lib/receiptGenerator.ts
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Membuat file PDF kwitansi menggunakan Puppeteer.
 * @param orderId ID order untuk kwitansi yang akan dibuat.
 * @param normalizedName ID order untuk kwitansi yang akan dibuat.
 * @param schoolSlug Slug nama sekolah untuk path folder.
 * @returns Path publik ke file PDF yang baru dibuat.
 */
export async function generateAndSaveReceipt(orderId: string, schoolSlug: string, normalizedName: string): Promise<string> {
    console.log(`[Receipt] Starting PDF generation for order ID: ${orderId}`);
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Argumen penting untuk lingkungan produksi/Linux
    });
    const page = await browser.newPage();

    // URL halaman kwitansi yang akan kita "cetak"
    const receiptUrl = `${process.env.APP_URL}/kwitansi/${encodeURIComponent(orderId)}`;
    
    console.log(`[Receipt] Navigating to: ${receiptUrl}`);
    await page.goto(receiptUrl, { waitUntil: 'networkidle0' });

    // Siapkan path untuk menyimpan file PDF
    const receiptDir = path.join(process.cwd(), 'public', 'uploads', 'permanent', schoolSlug, 'receipts');
    await fs.mkdir(receiptDir, { recursive: true });
    
    const filename = `kwitansi-${orderId.split('-')[0]}${normalizedName}.pdf`;
    const pdfPath = path.join(receiptDir, filename);

    // Cetak halaman sebagai PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
    });

    console.log(`[Receipt] PDF saved to: ${pdfPath}`);
    await browser.close();

    // Kembalikan path yang bisa diakses secara publik
    return `/uploads/permanent/${schoolSlug}/receipts/${filename}`;
}