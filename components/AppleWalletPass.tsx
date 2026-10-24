"use client";

import React from "react";
import { QueueToken } from "@/lib/types";
import { Check, Clock, Sparkles } from "lucide-react";

interface AppleWalletPassProps {
  ticket: QueueToken;
  isJustBooked?: boolean;
}

export function AppleWalletPass({ ticket, isJustBooked }: AppleWalletPassProps) {
  const isWaiting = ticket.status === "waiting" || ticket.status === "pending";
  const isCalled = ticket.status === "called" || ticket.status === "confirmed";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isWaiting
          ? "border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 shadow-[0_8px_24px_rgba(245,158,11,0.08)]"
          : isJustBooked
          ? "border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20 shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
          : "border-black/[0.06] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Top Header Card Area */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-xs font-bold text-white shadow-2xs">
              ⚡
            </span>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b] block leading-none">
                {ticket.serviceName || "Campus Facility"}
              </span>
              <span className="text-xs font-bold text-[#1d1d1f] mt-0.5 block">
                Digital Fast-Pass
              </span>
            </div>
          </div>

          {/* Status Pill */}
          {isWaiting ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Calling Turn...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80">
              <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
              Called · Ready
            </span>
          )}
        </div>

        {/* Center: Token & Purpose */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Item / Purpose
            </span>
            <div className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight mt-0.5">
              {ticket.itemOrPurpose || "Campus Queue Access"}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Token Number
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#1d1d1f] tracking-tight font-mono">
              #{ticket.tokenNumber || "01"}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Cutout Divider Lines */}
      <div className="relative flex items-center justify-between px-3">
        <div className="h-4 w-4 -ml-5 rounded-full bg-[#fbfbfd] border-r border-black/[0.06]" />
        <div className="flex-1 border-b border-dashed border-neutral-200 mx-2" />
        <div className="h-4 w-4 -mr-5 rounded-full bg-[#fbfbfd] border-l border-black/[0.06]" />
      </div>

      {/* Bottom Stub / Timestamp Info */}
      <div className="p-4 sm:p-5 pt-3 bg-neutral-50/50 flex items-center justify-between text-xs text-[#6e6e73]">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#86868b]" />
          <span>Scheduled: <strong className="text-[#1d1d1f]">{ticket.scheduledTime || "Now"}</strong></span>
        </div>

        <div className="font-mono text-[10px] text-[#86868b]">
          ID: {ticket.id}
        </div>
      </div>
    </div>
  );
}
