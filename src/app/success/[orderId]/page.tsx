import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { type ReceiptData } from "@/types/receipt"; // Impor tipe ini tetap dibutuhkan untuk formatting
import { SuccessPageClient } from "@/components/status/SuccessPageClient"; // Impor komponen klien

const registrationDetailsInclude = {
  registration: {
    include: {
      school: true,
      participants: true,
      companions: true,
    },
  },
};
type PaymentWithDetails = Prisma.PaymentGetPayload<{ include: typeof registrationDetailsInclude }>;

async function getRegistrationDetails(orderId: string): Promise<PaymentWithDetails | null> {
    const payment = await prisma.payment.findUnique({
        where: { id: orderId },
        include: registrationDetailsInclude,
    });
    return payment;
}

// 4. Fungsi helper untuk memformat data dari database ke format yang dibutuhkan oleh kwitansi
function formatDataForReceipt(paymentData: PaymentWithDetails): ReceiptData | null {
    const { registration } = paymentData;
    if (!registration) return null; // Jika karena suatu alasan relasi registrasi tidak ada
    
    // Hitung biaya dari data yang ada
    const participantCost = registration.participants.length * 38000;
    const companionCost = registration.companions.length * 26000;

    return {
      schoolData: registration.school,
      excelData: {
        participants: registration.participants,
        companions: registration.companions,
      },
      tentChoice: {
        type: registration.tentType, // Tipe Enum langsung dari Prisma
        capacity: registration.tentCapacity || 0,
        cost: registration.tentFee,
      },
      costs: {
        participants: participantCost,
        companions: companionCost,
        total: registration.totalFee,
      },
      kavling: registration.kavlingNumber ? {
        number: registration.kavlingNumber,
        capacity: registration.tentCapacity || 0,
      } : null,
    };
}
interface SuccessPageProps {
  params: {
    orderId: string;
  };
  searchParams: {
    manual?: string;
  };
}
export default async function SuccessPage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any
) {
  // Langsung lakukan casting ke tipe yang benar di dalam fungsi
  const { params, searchParams } = props as SuccessPageProps;
  const decodedOrderId = decodeURIComponent(params.orderId);
  const registrationDetails = await getRegistrationDetails(decodedOrderId);

  if (!registrationDetails) {
    return notFound();
  }
  
  const receiptData = formatDataForReceipt(registrationDetails);
  const isFromManualPayment = searchParams.manual === 'true';

  // Cukup render komponen klien dan teruskan data sebagai props
  return (
    <SuccessPageClient 
        receiptData={receiptData}
        orderId={decodedOrderId}
        isFromManualPayment={isFromManualPayment}
    />
  );
}