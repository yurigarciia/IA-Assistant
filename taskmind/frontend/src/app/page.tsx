"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type { Task, Status } from "@/types/task";
import { fetchTasks, updateTaskStatus } from "@/lib/api";
import NewTaskModal from "@/components/NewTaskModal";
import KanbanCard from "@/components/KanbanCard";
import { COLUMNS } from "@/lib/columns";

const URGENCIA_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const uDiff = URGENCIA_ORDER[a.urgencia] - URGENCIA_ORDER[b.urgencia];
    if (uDiff !== 0) return uDiff;
    if (a.prazo_inf && b.prazo_inf)
      return new Date(a.prazo_inf).getTime() - new Date(b.prazo_inf).getTime();
    if (a.prazo_inf) return -1;
    if (b.prazo_inf) return 1;
    return new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime();
  });
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

export default function Home() {
  const { data: tasks, isLoading, mutate } = useSWR<Task[]>(
    "tasks",
    () => fetchTasks(),
    { refreshInterval: 15000 }
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleUpdate = useCallback(() => mutate(), [mutate]);

  const handleMove = useCallback(
    async (taskId: string, newStatus: Status) => {
      setMovingId(taskId);
      try {
        await updateTaskStatus(taskId, newStatus);
        await mutate();
      } finally {
        setMovingId(null);
      }
    },
    [mutate]
  );

  const grouped = useMemo(() => {
    const all = (tasks ?? []).filter((t) => matchSearch(t, search));
    return Object.fromEntries(
      COLUMNS.map((col) => [col.status, sortTasks(all.filter((t) => t.status === col.status))])
    ) as Record<Status, Task[]>;
  }, [tasks, search]);

  const total = tasks?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white tracking-tight">TaskMind</span>
          {total > 0 && (
            <span className="text-xs text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded-md">
              {total} tarefas
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-white/[0.04] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20 w-52 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">×</button>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-sm bg-white text-black font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nova tarefa
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 flex overflow-x-auto px-4 py-5 gap-3 items-start">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-32">
            <span className="text-gray-600 text-sm">Carregando...</span>
          </div>
        ) : (
          COLUMNS.map((col) => {
            const colTasks = grouped[col.status] ?? [];
            return (
              <div
                key={col.status}
                className="flex-shrink-0 w-72 flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.06]">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </span>
                  {colTasks.length > 0 && (
                    <span className="ml-auto text-xs text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {colTasks.length}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <span className="text-xs text-gray-700">Vazio</span>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        onMove={handleMove}
                        onUpdate={handleUpdate}
                        moving={movingId === task.id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleUpdate}
      />
    </div>
  );
}
