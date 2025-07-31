// src/app/api/payment/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

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


  if (!payment) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ status: payment.status });
}
