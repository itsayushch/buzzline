"use client";

import React, { useState } from "react";
import { CampusService } from "@/lib/types";
import { X, Zap, Clock, Calendar, Check, ArrowRight, ShieldCheck } from "lucide-react";

interface BookingDrawerProps {
  isOpen: boolean;
  service: CampusService | null;
  onClose: () => void;
  onClaimToken: (serviceId: string) => void;
  onReserve: (serviceId: string, item: string, time: string) => void;
}

export function BookingDrawer({
  isOpen,
  service,
  onClose,
  onClaimToken,
  onReserve,
}: BookingDrawerProps) {
  const [activeTab, setActiveTab] = useState<"pass" | "reserve">("pass");
  const [purpose, setPurpose] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("In 15 mins");

  if (!isOpen || !service) return null;

  const currentPurpose = purpose || (service.items.length > 0 ? service.items[0] : "");

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReserve(service.id, currentPurpose, scheduledTime.trim() || "In 15 mins");
    onClose();
  };

  const handleFastPassSubmit = () => {
    onClaimToken(service.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between p-5 border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-xl border border-black/[0.04] shadow-2xs">
                {service.icon}
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1d1d1f] leading-tight">
                  {service.name}
                </h3>
                <span className="text-xs text-[#86868b]">{service.location}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Live Facility Snapshot Card */}
            <div className="rounded-2xl border border-black/[0.06] bg-neutral-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                    Current Queue Wait
                  </span>
                  <div className="text-2xl font-black text-[#1d1d1f] tracking-tight mt-0.5">
                    ~{service.queueMinutes} mins
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                    Available Spots
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {service.spotsAvailable ?? 0} of {service.capacity} open
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-black/[0.04]">
                <span className="text-[11px] font-semibold text-[#86868b] block mb-1.5">
                  {service.detailsLabel}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {service.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPurpose(item)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        currentPurpose === item
                          ? "bg-[#1d1d1f] text-white border-transparent font-semibold shadow-xs"
                          : "bg-white text-[#1d1d1f] border-black/[0.08] hover:bg-neutral-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-2 rounded-xl bg-neutral-100 p-1 border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setActiveTab("pass")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "pass"
                    ? "bg-white text-[#1d1d1f] shadow-xs"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Instant Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reserve")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "reserve"
                    ? "bg-white text-[#1d1d1f] shadow-xs"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-[#0071e3]" />
                <span>Schedule / Pre-order</span>
              </button>
            </div>

            {/* Tab 1: Instant Fast Pass */}
            {activeTab === "pass" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <span>Real-Time Digital Queue Skip</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                    Claim a live digital token now. Your turn updates live via Firebase RTDB from "waiting" to "called" when counter is ready.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFastPassSubmit}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1d1d1f] hover:bg-black text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span>Claim Digital Token for {service.name}</span>
                </button>
              </div>
            )}

            {/* Tab 2: Scheduled Reservation or Food Pre-order */}
            {activeTab === "reserve" && (
              <form onSubmit={handleReserveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    {service.id === "canteen"
                      ? "Select Dish or Item"
                      : service.id === "library"
                      ? "Desk or Discussion Pod"
                      : "Booking Purpose"}
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={service.items[0] || "e.g. Maggi, Quiet Desk..."}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                    Target Arrival / Pickup Time
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {["In 10 mins", "In 15 mins", "In 30 mins"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setScheduledTime(preset)}
                        className={`text-xs py-1.5 rounded-lg border text-center transition cursor-pointer ${
                          scheduledTime === preset
                            ? "bg-[#1d1d1f] text-white border-transparent font-medium"
                            : "bg-white text-[#6e6e73] border-black/[0.08] hover:bg-neutral-50"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="e.g. In 15 mins or 2:30 PM"
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Confirm Reservation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/[0.06] bg-neutral-50 text-center text-[11px] text-[#86868b]">
          Synced live with Firebase Realtime Database
        </div>
      </div>
    </div>
  );
}
