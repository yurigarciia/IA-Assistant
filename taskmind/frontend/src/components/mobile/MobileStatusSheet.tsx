"use client";

import { useEffect } from "react";
import type { Status } from "@/types/task";
import { COLUMNS } from "@/lib/columns";

interface Props {
  currentStatus: Status;
  onSelect: (status: Status) => void;
  onClose: () => void;
}

export default function MobileStatusSheet({ currentStatus, onSelect, onClose }: Props) {
  // Fecha ao apertar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full bg-zinc-900 rounded-t-2xl border-t border-zinc-800 pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
          Mover para
        </p>

        <div className="flex flex-col pb-4">
          {COLUMNS.map((col) => {
            const isActive = col.status === currentStatus;
            return (
              <button
                key={col.status}
                onClick={() => onSelect(col.status)}
                disabled={isActive}
                className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  isActive
                    ? "opacity-40 cursor-default"
                    : "active:bg-zinc-800"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot}`} />
                <span className={`text-sm font-medium ${isActive ? "text-zinc-400" : col.color}`}>
                  {col.label}
                </span>
                {isActive && (
                  <span className="ml-auto text-xs text-zinc-600">atual</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
