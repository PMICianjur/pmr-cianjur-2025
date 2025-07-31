"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await signIn("credentials", {
            redirect: false, // Kita handle redirect secara manual
            username: username,
            password: password,
        });

        if (result?.error) {
            toast.error("Login Gagal", { description: "Username atau password salah." });
            setIsLoading(false);
        } else {
            toast.success("Login Berhasil!");
            // Redirect ke dashboard setelah login berhasil
            router.push('/dashboard');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    className="border-pmi-red"
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="admin"
                    
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    className="border-pmi-red"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
            </div>
            <Button type="submit" className="w-full border-1  border-black bg-pmi-red text-white rounded-lg hover:border-2 hover:border-pmi-red hover:bg-white hover:text-pmi-red transition-colors duration-200" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
            </Button>
        </form>
    );
}