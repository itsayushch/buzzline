"use client";

import { useState } from "react";
import { useLocations } from "@/lib/locationsContext";
import { CampusService } from "@/lib/types";
import { AppleWalletPass } from "@/components/AppleWalletPass";
import { BookingDrawer } from "@/components/BookingDrawer";
import { Zap, Clock, Users, ArrowRight, Sparkles, Ticket } from "lucide-react";

export default function StudentPage() {
  const { services, tickets, claimToken, reserveDesk, bookTicket } =
    useLocations();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [drawerService, setDrawerService] = useState<CampusService | null>(null);
  const [justBookedId, setJustBookedId] = useState<string | null>(null);

  const handleOpenDrawer = (service: CampusService) => {
    setDrawerService(service);
  };

  const handleCloseDrawer = () => {
    setDrawerService(null);
  };

  const handleFastPassClaim = (serviceId: string) => {
    const token = claimToken(serviceId, "Student Express", "Immediate");
    setJustBookedId(token.id);
  };

  const handleReservation = (
    serviceId: string,
    item: string,
    time: string
  ) => {
    if (serviceId === "library") {
      const res = reserveDesk(
        serviceId,
        item.includes("Pod") ? "Discussion Pod 2" : "Silent Desk #14",
        time
      );
      setJustBookedId(res.id);
    } else {
      const newTicket = bookTicket(serviceId, item, time);
      setJustBookedId(newTicket.id);
    }
  };

  // Filter services by category
  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter(
          (s) => s.category === activeCategory || s.type === activeCategory
        );

  const getRushColor = (mins: number) => {
    if (mins <= 5)
      return {
        dot: "bg-[#34c759]",
        label: "Low Rush",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
      };
    if (mins <= 15)
      return {
        dot: "bg-[#ff9500]",
        label: "Moderate Rush",
        bg: "bg-amber-50 text-amber-900 border-amber-200/60",
      };
    return {
      dot: "bg-[#ff3b30]",
      label: "Heavy Rush",
      bg: "bg-rose-50 text-rose-800 border-rose-200/60",
    };
  };

  const filterTabs = [
    { id: "all", label: "All Spots" },
    { id: "canteen", label: "Canteen" },
    { id: "library", label: "Library" },
    { id: "xerox", label: "Print Hub" },
    { id: "admin", label: "Registrar" },
    { id: "clinic", label: "Clinic" },
    { id: "gym", label: "Gym" },
  ];

  return (
    <div className="flex-1 bg-[#fbfbfd] text-[#1d1d1f] pb-24 font-sans">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Minimalist Apple Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/60 px-3 py-1 text-[11px] font-semibold text-[#1d1d1f] mb-3 border border-black/[0.04]">
              <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span>Campus Live Queues</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
              Wait Times & Digital Fast Pass
            </h1>
            <p className="mt-1.5 text-sm text-[#6e6e73] max-w-xl">
              Track real-time queues across campus. Skip the lines by claiming a live digital pass or booking study pods in advance.
            </p>
          </div>

          {/* Quick Metrics Chip */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-2.5 shadow-xs flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                  Shortest Wait
                </span>
                <span className="text-xs font-bold text-[#1d1d1f]">
                  Clinic · ~5 mins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Apple-style Filter Pill Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {filterTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-full px-4 py-2 font-medium transition-all whitespace-nowrap cursor-pointer select-none text-xs ${
                  isActive
                    ? "bg-[#1d1d1f] text-white shadow-xs font-semibold"
                    : "bg-white text-[#6e6e73] border border-black/[0.06] hover:text-[#1d1d1f] hover:bg-neutral-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Location Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const rush = getRushColor(service.queueMinutes);

            return (
              <div
                key={service.id}
                className="group flex flex-col justify-between rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  {/* Card Header: Category & Rush Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                      {service.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${rush.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${rush.dot} animate-pulse`} />
                      {rush.label}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="mt-3 flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-xl border border-black/[0.04] shrink-0">
                      {service.icon}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#1d1d1f] leading-snug">
                        {service.name}
                      </h2>
                      <span className="text-xs text-[#86868b] block mt-0.5">
                        {service.location}
                      </span>
                    </div>
                  </div>

                  {/* Scannable Wait Time & Capacity */}
                  <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                        Estimated Wait
                      </span>
                      <div className="text-2xl font-black text-[#1d1d1f] tracking-tight mt-0.5 font-mono">
                        ~{service.queueMinutes}{" "}
                        <span className="text-xs font-semibold text-[#86868b] font-sans">
                          mins
                        </span>
                      </div>
                    </div>

                    {service.spotsAvailable !== undefined && (
                      <div className="text-right">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                          Capacity
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {service.spotsAvailable} open
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Highlight Preview */}
                  <div className="mt-3 bg-neutral-50/80 rounded-xl p-2.5 border border-black/[0.04]">
                    <span className="text-[10px] font-semibold text-[#86868b] block uppercase tracking-wider">
                      {service.detailsLabel}:
                    </span>
                    <p className="text-xs text-[#1d1d1f] font-medium truncate mt-0.5">
                      {service.items.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-5 pt-3.5 border-t border-black/[0.04] flex items-center justify-between">
                  <span className="text-[10px] text-[#86868b] font-mono">
                    {service.lastUpdated}
                  </span>
                  <button
                    onClick={() => handleOpenDrawer(service)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1d1d1f] hover:bg-black text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Get Fast Pass</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Apple Wallet-Style Live Queue Passes Section */}
        {tickets.length > 0 && (
          <section className="pt-6 border-t border-black/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-amber-500" />
                  <h2 className="text-lg font-bold text-[#1d1d1f]">
                    Your Live Wallet Passes
                  </h2>
                </div>
                <p className="text-xs text-[#6e6e73]">
                  Digital tickets update automatically in real time via Firebase WebSocket.
                </p>
              </div>

              <span className="rounded-full bg-neutral-200/70 px-3 py-1 text-xs font-semibold text-[#1d1d1f]">
                {tickets.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <AppleWalletPass
                  key={ticket.id}
                  ticket={ticket}
                  isJustBooked={ticket.id === justBookedId}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Slide-over Booking Sheet / Drawer */}
      <BookingDrawer
        isOpen={Boolean(drawerService)}
        service={drawerService}
        onClose={handleCloseDrawer}
        onClaimToken={handleFastPassClaim}
        onReserve={handleReservation}
      />
    </div>
  );
}
