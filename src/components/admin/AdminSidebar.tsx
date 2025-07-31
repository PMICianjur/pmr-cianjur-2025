"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, } from "framer-motion";
import { IconHome, IconUsers, IconUserSquare, IconTent,} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/dashboard", icon: IconHome, },
    { href: "/pendaftar", icon: IconUsers,},
    { href: "/peserta", icon: IconUserSquare,},
    { href: "/pendamping", icon: IconUserSquare, },
    { href: "/akomodasi", icon: IconTent,},
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            animate={{ width: 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden md:flex flex-col border-r border-neutral-800 h-screen sticky top-0"
        >
            <nav className="flex-1 p-4 space-y-2">
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-4 p-3 rounded-lg transition-colors duration-200",
                            pathname.startsWith(link.href)
                                ? "bg-pmi-red text-white"
                                : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        )}
                    >
                        <link.icon size={22} />
                    </Link>
                ))}
            </nav>
        </motion.aside>
    );
}