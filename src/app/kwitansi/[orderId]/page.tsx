import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptComponent from "@/components/receipt/ReceiptComponent";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Tipe khusus untuk parameter halaman
type ReceiptPageParams = {
  orderId: string;
};

export default async function ReceiptPage({
  params
}: {
  params: ReceiptPageParams;
}) {
  // Validasi ketat parameter
  if (!params || typeof params.orderId !== "string" || !params.orderId.trim()) {
    notFound();
  }

  const decodedOrderId = decodeURIComponent(params.orderId);
  const data = await fetchReceiptData(decodedOrderId);

  if (!data) {
    notFound();
  }

  return (
    <div className="w-[210mm]">
      <ReceiptComponent data={data} orderId={decodedOrderId} />
    </div>
  );
}

// Fungsi untuk fetch data kwitansi
async function fetchReceiptData(orderId: string) {
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

    if (!payment) return null;

    const { registration } = payment;
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
        companions: 0,
        total: registration.totalFee,
      },
      kavling: {
        number: registration.kavlingNumber || 0,
        capacity: registration.tentCapacity || 0,
      },
    };
  } catch (error) {
    console.error("Gagal mengambil data kwitansi:", error);
    return null;
  }
}

// Fungsi metadata dengan tipe yang benar
export async function generateMetadata({ params }: { params: ReceiptPageParams }) {
  return {
    title: `Kwitansi #${params.orderId}`,
    description: "Detail kwitansi pembayaran peserta",
  };
}

// Solusi tambahan untuk type checking
export type ReceiptPageProps = {
  params: ReceiptPageParams;
};