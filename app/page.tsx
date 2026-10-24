"use client";

import { useState } from "react";
import { useCanteen } from "@/lib/canteenContext";
import { CampusService } from "@/lib/types";

export default function StudentPage() {
  const { services, tickets, bookTicket } = useCanteen();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("canteen");
  const [purposeInput, setPurposeInput] = useState<string>("Chole Bhature");
  const [timeInput, setTimeInput] = useState<string>("In 15 mins");
  const [justBookedId, setJustBookedId] = useState<string | null>(null);

  const selectedService =
    services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSelectServiceForBooking = (service: CampusService, defaultItem?: string) => {
    setSelectedServiceId(service.id);
    if (defaultItem) {
      setPurposeInput(defaultItem);
    } else if (service.items.length > 0) {
      setPurposeInput(service.items[0]);
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const item = purposeInput.trim() || selectedService.items[0] || "General Token";
    const newTicket = bookTicket(selectedServiceId, item, timeInput.trim());
    setJustBookedId(newTicket.id);
  };

  // Filter services by category
  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category === activeCategory);

  const getRushBadge = (mins: number) => {
    if (mins <= 5) {
      return {
        label: "Low Rush",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    }
    if (mins <= 15) {
      return {
        label: "Moderate Rush",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    }
    return {
      label: "Heavy Rush",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    };
  };

  const categories = [
    { id: "all", label: "All Spots", icon: "🏫" },
    { id: "canteen", label: "Canteen & Food", icon: "🍲" },
    { id: "library", label: "Library & Desks", icon: "📚" },
    { id: "xerox", label: "Print & Xerox", icon: "🖨️" },
    { id: "admin", label: "Admin & Fees", icon: "🏛️" },
    { id: "clinic", label: "Health Clinic", icon: "🏥" },
    { id: "gym", label: "Gym & Sports", icon: "🏋️" },
  ];

  return (
    <div className="flex-1 bg-slate-50 text-slate-800 pb-16">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Hero Header & Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                Live Campus Queue Monitor
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Campus Queue & Rush Tracker
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Real-time queue wait times across Canteen, Library, Print Shop,
                Admin Office, Clinic & Gym.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Shortest Wait
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                  🏥 Clinic (~5m)
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Canteen Queue
                </span>
                <span className="text-base sm:text-lg font-extrabold text-amber-700">
                  🍲 ~{services.find((s) => s.id === "canteen")?.queueMinutes || 8}m
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Active Desks
                </span>
                <span className="text-base sm:text-lg font-extrabold text-blue-700">
                  📚 16 Free
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Campus Facilities Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const badge = getRushBadge(service.queueMinutes);

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl shadow-2xs">
                        {service.icon}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">
                          {service.name}
                        </h2>
                        <span className="text-[11px] text-slate-400">
                          {service.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wait Time Display */}
                  <div className="mt-4 flex items-center justify-between border-y border-slate-100 py-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Estimated Wait
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        ~{service.queueMinutes} mins
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${badge.bg}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${badge.dot} animate-pulse`}
                      />
                      {badge.label}
                    </span>
                  </div>

                  {/* Details / Sub-items */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {service.detailsLabel}:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {service.items.slice(0, 3).map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelectServiceForBooking(service, item)}
                          className="flex items-center justify-between rounded-md px-1.5 py-0.5 hover:bg-slate-50 transition-colors cursor-pointer text-[11px]"
                          title="Click to select for booking"
                        >
                          <span className="truncate max-w-[200px]">
                            • {item}
                          </span>
                          <span className="text-[10px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100">
                            Select +
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated {service.lastUpdated}
                  </span>
                  <button
                    onClick={() => handleSelectServiceForBooking(service)}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 cursor-pointer"
                  >
                    Get Token / Order →
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Booking & Token Generation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200/60">
              ⚡ Fast Pass Digital Token
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900">
              Reserve Spot or Skip Counter Line
            </h2>
            <p className="text-xs text-slate-500">
              Pre-order canteen food, reserve print jobs, or book library study desks.
            </p>
          </div>

          <form onSubmit={handleBook} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="serviceSelect"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Campus Facility
              </label>
              <div className="mt-1.5">
                <select
                  id="serviceSelect"
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const s = services.find((srv) => srv.id === e.target.value);
                    if (s && s.items.length > 0) setPurposeInput(s.items[0]);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name} (~{s.queueMinutes}m wait)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="purposeInput"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Item / Booking Purpose
              </label>
              <div className="mt-1.5">
                <input
                  id="purposeInput"
                  type="text"
                  value={purposeInput}
                  onChange={(e) => setPurposeInput(e.target.value)}
                  placeholder="e.g. Maggi, Print 20 Pages, Study Desk Pod..."
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="timeInput"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Arrival / Pickup Time
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="timeInput"
                  type="text"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder="In 15 mins"
                  required
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Get Token
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Live Active Tickets & Orders */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Your Digital Tokens & Orders (Live State)
              </h2>
              <p className="text-xs text-slate-500">
                Newly issued tokens start in pending state and confirm automatically after 2 seconds.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {tickets.length} active
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm">No tokens or bookings requested yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Book a spot or order above, or tell the AI Assistant to watch the live confirmation demo!
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.map((ticket) => {
                const isJustBooked = ticket.id === justBookedId;
                const isPending = ticket.status === "pending";

                return (
                  <div
                    key={ticket.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition-all duration-300 ${
                      isPending
                        ? "border-amber-300 bg-amber-50/50 shadow-xs ring-2 ring-amber-400/20"
                        : isJustBooked
                        ? "border-emerald-300 bg-emerald-50/30 shadow-xs"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {ticket.itemOrPurpose}
                        </span>
                        <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          Token #{ticket.tokenNumber}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          #{ticket.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">
                          {ticket.serviceName}
                        </span>{" "}
                        · Scheduled for{" "}
                        <span className="font-medium text-slate-800">
                          {ticket.scheduledTime}
                        </span>
                      </p>
                    </div>

                    <div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                          <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping" />
                          Pending (confirming in 2s...)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                          <svg
                            className="h-4 w-4 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Confirmed - Token Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
