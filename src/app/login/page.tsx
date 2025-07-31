// src/app/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg hover:shadow-lg hover:shadow-pmi-red transition-all">
                <div className="text-center">
                    <h1 className="text-3xl text-pmi-red font-bold font-serif">Admin Login</h1>
                    <p className="mt-2 text-gray-600">Masukkan Username dan Password untuk Mengakses Data Pendaftaran</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}