// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { AdminRole } from "@prisma/client";

// Perluas tipe User bawaan
declare module "next-auth" {
  interface User extends DefaultUser {
    role?: AdminRole;
    username?: string;
  }
  
  interface Session {
    user?: {
      role?: AdminRole;
      username?: string;
    } & DefaultSession["user"];
  }
}

// Perluas tipe JWT (token) bawaan
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: AdminRole;
    username?: string;
  }
}