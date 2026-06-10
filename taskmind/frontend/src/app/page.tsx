"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type { Task } from "@/types/task";
import { fetchTasks } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import NewTaskModal from "@/components/NewTaskModal";

const URGENCIAS = ["critica", "alta", "media", "baixa"] as const;
type Urgencia = (typeof URGENCIAS)[number];

const URGENCIA_LABELS: Record<Urgencia, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const URGENCIA_CHIP_COLORS: Record<Urgencia, string> = {
  critica: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  alta: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
  media: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  baixa: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
};

type SortKey = "urgencia" | "criada_em" | "prazo_inf";

const URGENCIA_ORDER: Record<Urgencia, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

function sortTasks(tasks: Task[], key: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (key === "urgencia") return URGENCIA_ORDER[a.urgencia] - URGENCIA_ORDER[b.urgencia];
    if (key === "prazo_inf") {
      if (!a.prazo_inf && !b.prazo_inf) return 0;
      if (!a.prazo_inf) return 1;
      if (!b.prazo_inf) return -1;
      return new Date(a.prazo_inf).getTime() - new Date(b.prazo_inf).getTime();
    }
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
  const { data: tasks, isLoading, mutate } = useSWR<Task[]>("tasks", () => fetchTasks(), {
    refreshInterval: 10000,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [urgenciaFilter, setUrgenciaFilter] = useState<Urgencia | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("urgencia");
  const [showConcluidas, setShowConcluidas] = useState(false);

  const handleUpdate = useCallback(() => mutate(), [mutate]);

  const abertas = useMemo(() => {
    const filtered = (tasks ?? []).filter(
      (t) =>
        t.status === "aberta" &&
        matchSearch(t, search) &&
        (!urgenciaFilter || t.urgencia === urgenciaFilter)
    );
    return sortTasks(filtered, sortKey);
  }, [tasks, search, urgenciaFilter, sortKey]);

  const concluidas = useMemo(() => {
    const filtered = (tasks ?? []).filter(
      (t) =>
        t.status === "concluida" &&
        matchSearch(t, search) &&
        (!urgenciaFilter || t.urgencia === urgenciaFilter)
    );
    return sortTasks(filtered, sortKey);
  }, [tasks, search, urgenciaFilter, sortKey]);

  const totalAbertas = (tasks ?? []).filter((t) => t.status === "aberta").length;
  const hasActiveFilter = !!search || !!urgenciaFilter;

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-bold text-lg tracking-tight">TaskMind</span>
          {totalAbertas > 0 && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {totalAbertas} abertas
            </span>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          + Nova tarefa
        </button>
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-800 px-6 py-3 flex flex-col gap-3 sticky top-[65px] bg-gray-950/95 backdrop-blur z-10">
        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, projeto ou tag..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-600 cursor-pointer"
          >
            <option value="urgencia">Urgência</option>
            <option value="criada_em">Mais recente</option>
            <option value="prazo_inf">Prazo</option>
          </select>
        </div>

        {/* Urgência filter chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setUrgenciaFilter(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              urgenciaFilter === null
                ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300"
            }`}
          >
            Todas
          </button>
          {URGENCIAS.map((u) => (
            <button
              key={u}
              onClick={() => setUrgenciaFilter(urgenciaFilter === u ? null : u)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                urgenciaFilter === u
                  ? URGENCIA_CHIP_COLORS[u]
                  : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300"
              }`}
            >
              {URGENCIA_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-gray-500 text-sm">Carregando...</span>
          </div>
        )}

        {!isLoading && abertas.length === 0 && concluidas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            {hasActiveFilter ? (
              <>
                <p className="text-gray-400 text-sm">Nenhuma tarefa encontrada.</p>
                <button
                  onClick={() => { setSearch(""); setUrgenciaFilter(null); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl">✓</p>
                <p className="text-gray-400 text-sm">Nenhuma tarefa aberta.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Criar primeira tarefa
                </button>
              </>
            )}
          </div>
        )}

        {/* Abertas */}
        {abertas.map((t) => (
          <TaskCard key={t.id} task={t} onUpdate={handleUpdate} />
        ))}

        {/* Concluídas */}
        {concluidas.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowConcluidas((v) => !v)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full py-2"
            >
              <span className={`transition-transform duration-200 inline-block ${showConcluidas ? "rotate-90" : ""}`}>
                ▶
              </span>
              <span className="uppercase tracking-widest font-semibold">
                Concluídas ({concluidas.length})
              </span>
              <span className="flex-1 border-t border-gray-800 ml-2" />
            </button>
            {showConcluidas && (
              <div className="flex flex-col gap-3 mt-2">
                {concluidas.map((t) => (
                  <TaskCard key={t.id} task={t} onUpdate={handleUpdate} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleUpdate}
      />
    </div>
  );
}
