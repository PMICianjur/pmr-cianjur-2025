// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from 'bcrypt';
import { headers } from "next/headers";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const admin = await prisma.admin.findUnique({
                    where: { username: credentials.username },
                });

                if (!admin) {
                    console.log("Login failed: User not found");
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    admin.password
                );

                if (!isPasswordValid) {
                    console.log("Login failed: Invalid password");
                    return null;
                }

                try {
                    const ip = (await headers()).get('x-forwarded-for') ?? 'N/A';
                    const userAgent = (await headers()).get('user-agent') ?? 'N/A';

                    await prisma.loginHistory.create({
                        data: {
                            adminId: admin.id,
                            ipAddress: ip,
                            userAgent: userAgent,
                        }
                    });
                    console.log(`Login event recorded for user: ${admin.username}`);
                } catch (error) {
                    console.error("Failed to record login history:", error);
                }

                // Sekarang kita mengembalikan objek yang cocok dengan tipe `User` yang sudah kita perluas
                return {
                    id: admin.id.toString(),
                    name: admin.name,
                    username: admin.username,
                    role: admin.role,
                };
            }
        })
    ],
    callbacks: {
        // --- PERBAIKAN DI SINI: TIDAK PERLU 'as any' LAGI ---
        async jwt({ token, user }) {
            // Saat login pertama kali, `user` akan ada dan sekarang memiliki tipe yang benar.
            if (user) {
                token.role = user.role;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            // `token` sekarang memiliki `role` dan `username` yang diketahui oleh TypeScript.
            // `session.user` juga sudah diperluas tipenya.
            if (session.user) {
                session.user.role = token.role;
                session.user.username = token.username;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};