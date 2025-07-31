// middleware.ts
export { default } from "next-auth/middleware";

export const config = { 
    // Tentukan rute mana yang ingin Anda lindungi
    matcher: [
"/((?!api|_next/static|_next/image|favicon.ico|login|$).*)",
    ] 
};