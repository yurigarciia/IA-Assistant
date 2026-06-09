"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { Task } from "@/types/task";
import { fetchTasks } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import NewTaskModal from "@/components/NewTaskModal";

const fetcher = () => fetchTasks({ status: "aberta" });

function groupTasks(tasks: Task[]) {
  const criticas = tasks.filter((t) => t.urgencia === "critica");
  const altas = tasks.filter((t) => t.urgencia === "alta");
  const medias = tasks.filter((t) => t.urgencia === "media");
  const baixas = tasks.filter((t) => t.urgencia === "baixa");
  return { criticas, altas, medias, baixas };
}

function Section({ title, tasks, onUpdate }: { title: string; tasks: Task[]; onUpdate: () => void }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h2>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: tasks, isLoading, mutate } = useSWR<Task[]>("tasks", fetcher, { refreshInterval: 10000 });
  const [modalOpen, setModalOpen] = useState(false);

  const handleUpdate = useCallback(() => mutate(), [mutate]);

  const grouped = tasks ? groupTasks(tasks) : null;
  const total = tasks?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-bold text-lg tracking-tight">TaskMind</span>
          {total > 0 && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {total} abertas
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

      {/* Body */}
      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-gray-500 text-sm">Carregando...</span>
          </div>
        )}

        {!isLoading && total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <p className="text-3xl">✓</p>
            <p className="text-gray-400 text-sm">Nenhuma tarefa aberta.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Criar primeira tarefa
            </button>
          </div>
        )}

        {grouped && (
          <>
            <Section title="Crítica" tasks={grouped.criticas} onUpdate={handleUpdate} />
            <Section title="Alta prioridade" tasks={grouped.altas} onUpdate={handleUpdate} />
            <Section title="Média prioridade" tasks={grouped.medias} onUpdate={handleUpdate} />
            <Section title="Baixa prioridade" tasks={grouped.baixas} onUpdate={handleUpdate} />
          </>
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
