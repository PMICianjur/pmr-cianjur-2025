// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Impor konfigurasi dari file terpisah

// File ini sekarang sangat bersih.
// Ia tidak mengekspor apa pun selain GET dan POST handler.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };