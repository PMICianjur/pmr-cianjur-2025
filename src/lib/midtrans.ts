import midtransClient from 'midtrans-client';

export const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string,
});