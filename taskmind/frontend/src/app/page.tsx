"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { Task } from "@/types/task";
import { fetchTasks } from "@/lib/api";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import NewTaskModal from "@/components/NewTaskModal";

export default function Home() {
  const { data: tasks = [], isLoading, mutate } = useSWR<Task[]>(
    "tasks",
    () => fetchTasks(),
    { refreshInterval: 15000 }
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleUpdate = useCallback(() => mutate(), [mutate]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      <Header
        total={tasks.length}
        search={search}
        onSearchChange={setSearch}
        onNewTask={() => setModalOpen(true)}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-zinc-600 text-sm">Carregando...</span>
        </div>
      ) : (
        <KanbanBoard tasks={tasks} search={search} onUpdate={handleUpdate} />
      )}

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleUpdate}
      />
    </div>
  );
}
