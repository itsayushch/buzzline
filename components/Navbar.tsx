"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCanteen } from "@/lib/canteenContext";

export function Navbar() {
  const pathname = usePathname();
  const { services, tickets } = useCanteen();

  const navLinks = [
    { href: "/", label: "Student Hub", icon: "🎓" },
    { href: "/staff", label: "Staff Portal", icon: "⚡" },
    { href: "/agent", label: "AI Assistant", icon: "🤖" },
  ];

  const pendingCount = tickets.filter((t) => t.status === "pending").length;
  const canteenService = services.find((s) => s.id === "canteen");
  const libraryService = services.find((s) => s.id === "library");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs shadow-2xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg font-bold text-white shadow-xs group-hover:bg-amber-600 transition-colors">
            ⚡
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Buzzline
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                🍲 ~{canteenService?.queueMinutes || 8}m · 📚 ~{libraryService?.queueMinutes || 12}m
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Campus-Wide Queues & Digital Fast Pass
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {link.href === "/" && pendingCount > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
