"use client";

import { useState } from "react";
import { useCanteen } from "@/lib/canteenContext";

export default function StaffPage() {
  const { services, updateServiceStatus } = useCanteen();
  const [selectedServiceId, setSelectedServiceId] = useState<string>("canteen");

  const activeService =
    services.find((s) => s.id === selectedServiceId) || services[0];

  const [queueMinutes, setQueueMinutes] = useState<number>(
    activeService.queueMinutes
  );
  const [itemsInput, setItemsInput] = useState<string>(
    activeService.items.join(", ")
  );
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // When changing selected facility, update the form fields
  const handleServiceChange = (id: string) => {
    setSelectedServiceId(id);
    const target = services.find((s) => s.id === id);
    if (target) {
      setQueueMinutes(target.queueMinutes);
      setItemsInput(target.items.join(", "));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedItems = itemsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    updateServiceStatus(selectedServiceId, {
      queueMinutes: Number(queueMinutes) || 0,
      items: parsedItems,
    });

    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 2500);
  };

  return (
    <div className="flex-1 bg-slate-50 text-slate-800 pb-16">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                ⚡ Campus Operations & Queue Broadcast
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Staff Control Panel
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Select any campus facility to update its wait time and broadcast status.
              </p>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live State Synchronized
            </span>
          </div>

          {/* Facility Selector */}
          <div className="mt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Campus Facility To Update
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceChange(service.id)}
                  className={`flex items-center gap-2 rounded-xl p-3 text-left transition-all cursor-pointer border ${
                    selectedServiceId === service.id
                      ? "border-amber-500 bg-amber-50/50 shadow-2xs ring-2 ring-amber-400/20"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{service.icon}</span>
                  <div className="overflow-hidden">
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {service.name}
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold font-mono">
                      ~{service.queueMinutes}m wait
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="queueMinutes"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Estimated Queue Wait Time (Minutes) for {activeService.name}
              </label>
              <div className="mt-1.5">
                <input
                  id="queueMinutes"
                  type="number"
                  min="0"
                  max="180"
                  value={queueMinutes}
                  onChange={(e) =>
                    setQueueMinutes(
                      Math.max(0, parseInt(e.target.value, 10) || 0)
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. 15"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Broadcasted as &quot;~{queueMinutes} min wait&quot; on student boards and to the AI Assistant.
              </p>
            </div>

            <div>
              <label
                htmlFor="itemsInput"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                {activeService.detailsLabel} (Comma-separated items)
              </label>
              <div className="mt-1.5">
                <textarea
                  id="itemsInput"
                  rows={3}
                  value={itemsInput}
                  onChange={(e) => setItemsInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Dishes, open counters, free desks, or active machines..."
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Separate entries with a comma.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 active:scale-[0.99] cursor-pointer"
              >
                Update Broadcast
              </button>

              {showNotification && (
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 border border-emerald-300 animate-fade-in shadow-2xs">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span>Updated! Broadcast live for {activeService.name}.</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* All Facility Broadcast Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Current Campus Broadcast Matrix
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {service.icon} {service.name}
                  </span>
                  <span className="font-extrabold text-amber-700 text-xs">
                    ~{service.queueMinutes}m
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  {service.items.slice(0, 2).join(", ")}
                </div>
                <div className="mt-1 text-[10px] text-slate-400 font-mono">
                  Updated {service.lastUpdated}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
