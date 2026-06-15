"use client";

import { useState, useMemo } from "react";
import type { Task, Status } from "@/types/task";
import { COLUMNS } from "@/lib/columns";
import MobileTaskCard from "./MobileTaskCard";

interface Props {
  tasks: Task[];
  search: string;
  onUpdate: () => void;
}

function matchSearch(task: Task, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    task.titulo.toLowerCase().includes(lower) ||
    (task.projeto?.toLowerCase().includes(lower) ?? false) ||
    (task.tags?.some((t) => t.toLowerCase().includes(lower)) ?? false)
  );
}

export default function MobileLayout({ tasks, search, onUpdate }: Props) {
  const [activeStatus, setActiveStatus] = useState<Status | "all">("all");

  const filtered = useMemo(
    () => tasks.filter((t) => matchSearch(t, search)),
    [tasks, search]
  );

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((col) => [
          col.status,
          filtered.filter((t) => t.status === col.status),
        ])
      ) as Record<Status, Task[]>,
    [filtered]
  );

  const visibleColumns =
    activeStatus === "all"
      ? COLUMNS.filter((col) => grouped[col.status].length > 0)
      : COLUMNS.filter((col) => col.status === activeStatus);

  const totalOpen = filtered.filter((t) => t.status !== "concluida").length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar de status */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto flex-shrink-0 border-b border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveStatus("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeStatus === "all"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Todas {totalOpen > 0 && `(${totalOpen})`}
        </button>

        {COLUMNS.map((col) => {
          const count = grouped[col.status].length;
          const isActive = activeStatus === col.status;
          return (
            <button
              key={col.status}
              onClick={() => setActiveStatus(col.status)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800/60 text-zinc-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              {col.label}
              {count > 0 && (
                <span className={`text-[10px] ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de tarefas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-safe">
        {filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-zinc-600 text-sm">Nenhuma tarefa encontrada</p>
          </div>
        )}

        {visibleColumns.map((col) => {
          const colTasks = grouped[col.status];
          if (colTasks.length === 0) return null;

          return (
            <section key={col.status}>
              {/* Cabeçalho da seção */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-semibold tracking-wide uppercase ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded tabular-nums ml-auto">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <MobileTaskCard key={task.id} task={task} onUpdate={onUpdate} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
