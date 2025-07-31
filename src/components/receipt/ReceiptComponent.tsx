// src/components/receipt/ReceiptComponent.tsx

import QRCodeComponent from './QRCodeComponent';
import { type ReceiptData } from "@/types/receipt";
// Helper untuk format mata uang
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function ReceiptComponent({ data, orderId }: { data: ReceiptData, orderId: string }) {
  const { schoolData, excelData, tentChoice, costs } = data;
  
  // URL untuk verifikasi via QR Code
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success/${orderId}`;

  return (
    // Gunakan font-sans sebagai dasar untuk kompatibilitas cetak
    <div className="bg-gray-100 p-8 font-sans">
      <div className="w-full max-w-[800px] mx-auto bg-white border border-gray-200 shadow-2xl">
        
        {/* KOP SURAT MODERN */}
        <header 
          className="p-8 text-white relative overflow-hidden" 
          style={{ backgroundColor: '#DC2626' }} // bg-pmi-red
        >
          <div 
            className="absolute -right-16 -top-16 w-48 h-48 border-4 border-white/20 rounded-full"
          ></div>
           <div 
            className="absolute -right-8 -top-8 w-32 h-32 border-2 border-white/20 rounded-full"
          ></div>

          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white p-1 rounded-md shadow-sm flex-shrink-0">
    <img id="receipt-logo" src="/logo-pmi.png" alt="Logo PMI" width={72} height={72} />
</div>
              <div className='text-left'>
                <h1 className="text-3xl font-bold font-serif tracking-tight">KWITANSI</h1>
                <p className="text-sm opacity-90 font-sans mt-1">
                  Pendaftaran PMR Kab. Cianjur 2025
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-sans text-xs uppercase tracking-widest opacity-80">No. Order</p>
              <p className="font-mono text-sm font-semibold mt-1 break-all">
  {orderId}
</p>
            </div>
          </div>
        </header>
        
        <main className="p-8">
          {/* DETAIL TRANSAKSI */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="font-sans text-sm text-gray-500">DITERIMA DARI</p>
              <p className="font-serif text-xl font-bold text-pmi-dark mt-1">{schoolData.normalizedName}</p>
              <p className="font-sans text-sm text-gray-700">a.n. {schoolData.coachName}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-sm text-gray-500">TANGGAL PEMBAYARAN</p>
              <p className="font-serif text-xl font-bold text-pmi-dark mt-1">
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* TABEL RINCIAN BIAYA */}
          <div className="font-sans">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-300">
                <tr className="text-left text-gray-500">
                  <th className="py-3 font-semibold uppercase tracking-wider">Deskripsi</th>
                  <th className="py-3 font-semibold uppercase tracking-wider text-center w-[20%]">Jumlah</th>
                  <th className="py-3 font-semibold uppercase tracking-wider text-right w-[25%]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 text-left text-gray-800">Biaya Pendaftaran Peserta</td>
                  <td className="py-4 text-center text-gray-600">{excelData.participants.length} orang</td>
                  <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(costs.participants)}</td>
                </tr>
                {excelData.companions.length > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-4 text-left text-gray-800">Biaya Pendaftaran Pendamping</td>
                    <td className="py-4 text-center text-gray-600">{excelData.companions.length} orang</td>
                    <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(costs.companions)}</td>
                  </tr>
                )}
                {tentChoice.cost > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-4 text-left text-gray-800">Sewa Tenda (Kapasitas {tentChoice.capacity} Orang)</td>
                    <td className="py-4 text-center text-gray-600">1 unit</td>
                    <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(tentChoice.cost)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL & STATUS */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(costs.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan</span>
                <span className="font-medium text-green-600">GRATIS</span>
              </div>
              <div className="border-t-2 border-dashed my-3"></div>
              <div className="flex justify-between items-center text-pmi-dark">
                <span className="font-serif text-xl font-bold">Total Dibayar</span>
                <span className="font-serif text-2xl font-bold text-pmi-red">{formatCurrency(costs.total)}</span>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER KWITANSI DENGAN QR CODE */}
        <footer className="mt-8 p-8 border-t-2 border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="text-left">
                <div className="p-3 bg-green-100 text-green-800 rounded-md inline-block">
                  <span className="font-sans text-xl font-bold tracking-widest uppercase">LUNAS</span>
                </div>
                <p className="font-sans text-xs text-gray-500 max-w-xs mt-4">
                  Kwitansi ini valid dan diterbitkan secara digital oleh sistem pendaftaran PMR Cianjur 2025.
                </p>
            </div>
            <div className="text-center">
              <QRCodeComponent url={verificationUrl} size={90} />
              <p className="font-sans text-[10px] mt-2 text-gray-600 uppercase tracking-wider">Scan untuk Verifikasi</p>
            </div>
        </footer>
      </div>
    </div>
  );
}