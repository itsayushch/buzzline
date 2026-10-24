"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocations } from "@/lib/locationsContext";
import { Zap, Radio, Ticket } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { tickets, isFirebaseLive } = useLocations();

  const navLinks = [
    { href: "/", label: "Student", shortLabel: "Student" },
    { href: "/staff", label: "Staff", shortLabel: "Staff" },
    { href: "/agent", label: "Agent", shortLabel: "Agent" },
  ];

  const activeTicketsCount = tickets.filter(
    (t) => t.status === "pending" || t.status === "waiting" || t.status === "called"
  ).length;

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.05] bg-[#fbfbfd]/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-[#1d1d1f]">
              Buzzline
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Campus Queues
            </span>
          </div>
        </Link>

        {/* Center: Apple-style Segmented Nav Pill */}
        <nav className="flex items-center gap-1 rounded-full bg-neutral-200/60 p-1 border border-black/[0.04]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs transition-all duration-200 select-none ${
                  isActive
                    ? "bg-white text-[#1d1d1f] font-semibold shadow-xs"
                    : "text-[#6e6e73] hover:text-[#1d1d1f] font-medium"
                }`}
              >
                <span>{link.label}</span>
                {link.href === "/" && activeTicketsCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1d1d1f] text-[10px] font-bold text-white shrink-0">
                    {activeTicketsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Dynamic Island Live Status Chip */}
        <div className="hidden sm:flex items-center gap-2">
          {activeTicketsCount > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white shadow-xs">
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              <span>{activeTicketsCount} {activeTicketsCount === 1 ? "Pass" : "Passes"} Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[#86868b] font-medium">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Syncing Live</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
