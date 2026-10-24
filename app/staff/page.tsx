"use client";

import { useState } from "react";
import { useLocations } from "@/lib/locationsContext";
import { Check, Plus, Minus, Radio, Sparkles } from "lucide-react";

export default function StaffPage() {
  const { services, updateServiceStatus } = useLocations();
  const [selectedServiceId, setSelectedServiceId] = useState<string>("canteen");

  const activeService =
    services.find((s) => s.id === selectedServiceId) || services[0];

  const [queueMinutes, setQueueMinutes] = useState<number>(
    activeService.queueMinutes
  );
  const [spotsAvailable, setSpotsAvailable] = useState<number>(
    activeService.spotsAvailable ?? 10
  );
  const [itemsInput, setItemsInput] = useState<string>(
    activeService.items.join(", ")
  );
  const [showToast, setShowToast] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  const handleServiceChange = (id: string) => {
    setSelectedServiceId(id);
    const target = services.find((s) => s.id === id);
    if (target) {
      setQueueMinutes(target.queueMinutes);
      setSpotsAvailable(target.spotsAvailable ?? 10);
      setItemsInput(target.items.join(", "));
    }
  };

  const handleAdjustMinutes = (delta: number) => {
    setQueueMinutes((prev) => Math.max(0, prev + delta));
  };

  const handleAdjustSpots = (delta: number) => {
    setSpotsAvailable((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedItems = itemsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    updateServiceStatus(selectedServiceId, {
      queueMinutes: Number(queueMinutes) || 0,
      spotsAvailable: Number(spotsAvailable) || 0,
      items: parsedItems,
      menu: selectedServiceId === "canteen" ? parsedItems : undefined,
    });

    setJustSaved(true);
    setShowToast(true);

    setTimeout(() => {
      setJustSaved(false);
    }, 2000);

    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  return (
    <div className="flex-1 bg-[#fbfbfd] text-[#1d1d1f] pb-24 font-sans relative">
      {/* Dynamic Island Floating Notification */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-white shadow-2xl border border-black/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black font-bold shrink-0">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold">
            Broadcast updated live for {activeService.name} (~{queueMinutes}m)
          </span>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-black/[0.06] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/60 px-3 py-1 text-[11px] font-semibold text-[#1d1d1f] mb-3 border border-black/[0.04]">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Staff Dispatch Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
              Queue & Capacity Control
            </h1>
            <p className="mt-1.5 text-sm text-[#6e6e73]">
              Update wait times and spot availability. Changes broadcast instantly across all connected student screens.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase RTDB Synced
            </span>
          </div>
        </div>

        {/* 2-Column Dispatch Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Clean Location Selector List */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] block mb-2 px-1">
              Select Campus Facility ({services.length})
            </span>

            <div className="space-y-2">
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceChange(service.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "border-black/[0.12] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-2 ring-black/[0.05]"
                        : "border-black/[0.04] bg-white/60 hover:bg-white hover:border-black/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-2xl shrink-0">{service.icon}</span>
                      <div className="truncate">
                        <span className="block text-sm font-bold text-[#1d1d1f] truncate">
                          {service.name}
                        </span>
                        <span className="text-xs text-[#86868b] truncate block mt-0.5">
                          {service.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-sm font-black text-[#1d1d1f] block font-mono">
                        ~{service.queueMinutes}m
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        {service.spotsAvailable ?? 0} open
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Focused Broadcast Control Card */}
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              {/* Active Facility Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.05]">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-2xl border border-black/[0.04]">
                    {activeService.icon}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[#1d1d1f]">
                      {activeService.name}
                    </h2>
                    <span className="text-xs text-[#86868b]">
                      {activeService.location}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                    Current Live
                  </span>
                  <span className="text-xl font-black text-[#1d1d1f] font-mono">
                    ~{activeService.queueMinutes}m
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Wait Time Stepper */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                      Queue Wait Time (Minutes)
                    </label>
                    <div className="flex gap-1">
                      {[5, 10, 15, 25].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQueueMinutes(preset)}
                          className={`text-xs px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                            queueMinutes === preset
                              ? "bg-[#1d1d1f] text-white border-transparent font-semibold"
                              : "bg-neutral-100 text-[#6e6e73] border-transparent hover:bg-neutral-200"
                          }`}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAdjustMinutes(-5)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] transition cursor-pointer shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={queueMinutes}
                      onChange={(e) =>
                        setQueueMinutes(
                          Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="flex-1 h-11 text-center rounded-xl border border-black/[0.08] bg-white text-lg font-black text-[#1d1d1f] outline-none font-mono focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustMinutes(5)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] transition cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Available Spots Stepper */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-2">
                    Open Spots / Desks
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAdjustSpots(-2)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] transition cursor-pointer shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={spotsAvailable}
                      onChange={(e) =>
                        setSpotsAvailable(
                          Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="flex-1 h-11 text-center rounded-xl border border-black/[0.08] bg-white text-lg font-black text-[#1d1d1f] outline-none font-mono focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustSpots(2)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] transition cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Menu / Counter Items */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-2">
                    {activeService.detailsLabel} (Comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={itemsInput}
                    onChange={(e) => setItemsInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-black/[0.08] bg-white p-3 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    placeholder="Dishes, free pods, or counter status..."
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#1d1d1f] hover:bg-black text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {justSaved ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
                        <span>✓ Broadcast Updated!</span>
                      </>
                    ) : (
                      <span>Publish Live Broadcast Updates</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
