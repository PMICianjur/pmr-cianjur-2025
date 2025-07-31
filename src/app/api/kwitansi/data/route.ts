// src/app/api/kwitansi/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  try {
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

    if (!payment || !payment.registration) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const reg = payment.registration;
    const data = {
      schoolData: {
        schoolName: reg.school.name,
        category: reg.school.category,
        coachName: reg.school.coachName,
        whatsapp: reg.school.whatsappNumber,
      },
      excelData: {
        participants: reg.participants,
        companions: reg.companions,
      },
      tentChoice: {
        type: reg.tentType,
        capacity: reg.tentCapacity || 0,
        cost: reg.tentFee,
      },
      costs: {
        participants: reg.baseFee - reg.tentFee,
        companions: reg.totalFee - reg.baseFee, // hitung sisa dari total
        total: reg.totalFee,
      },
      kavling: {
        number: reg.kavlingNumber || 0,
        capacity: reg.tentCapacity || 0,
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API_KWITANSI_DATA_ERROR]", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil data." }, { status: 500 });
  }
}
