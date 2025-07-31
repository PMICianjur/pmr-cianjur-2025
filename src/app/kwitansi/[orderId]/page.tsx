// src/app/kwitansi/[orderId]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptComponent from "@/components/receipt/ReceiptComponent"; // Gunakan kembali komponen kwitansi Anda

// Fungsi untuk mengambil data yang dibutuhkan oleh kwitansi
async function getReceiptData(orderId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: orderId },
        include: {
            registration: {
                include: {
                    school: true,
                    participants: true,
                    companions: true,
                },
            },
        },
    });
    if (!payment) return null;

    const { registration } = payment;
    
    // Format data agar cocok dengan yang diharapkan oleh ReceiptComponent
    return {
        schoolData: registration.school,
        excelData: {
            participants: registration.participants,
            companions: registration.companions,
        },
        tentChoice: {
            type: registration.tentType,
            capacity: registration.tentCapacity || 0,
            cost: registration.tentFee,
        },
        costs: {
            participants: registration.baseFee - registration.tentFee,
            companions: 0, // Perlu penyesuaian
            total: registration.totalFee,
        },
        kavling: {
            number: registration.kavlingNumber || 0,
            capacity: registration.tentCapacity || 0,
        }
    };
}

// Halaman ini adalah Server Component
export default async function ReceiptPage({ params }: { params: { orderId: string } }) {
    const orderId = decodeURIComponent(params.orderId);
    const data = await getReceiptData(orderId);

    if (!data) {
        notFound();
    }
    
    // Kita tambahkan styling sederhana untuk memastikan tidak ada margin/padding dari layout
    return (
        <html lang="en">
            <head>
                {/* Impor CSS global Anda jika diperlukan oleh ReceiptComponent */}
                <link rel="stylesheet" href="/globals.css" /> 
            </head>
            <body>
                 {/* Render HANYA komponen kwitansi */}
                <div className="w-[210mm]">
                    <ReceiptComponent data={data} orderId={orderId} />
                </div>
            </body>
        </html>
    );
}