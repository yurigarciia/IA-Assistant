"use client";

import { useCallback, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Task, Status } from "@/types/task";
import { updateTaskStatus } from "@/lib/api";
import { COLUMNS } from "@/lib/columns";
import KanbanColumn from "@/components/KanbanColumn";
import KanbanCard from "@/components/KanbanCard";

const URGENCIA_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const u = URGENCIA_ORDER[a.urgencia] - URGENCIA_ORDER[b.urgencia];
    if (u !== 0) return u;
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

interface Props {
  tasks: Task[];
  search: string;
  onUpdate: () => void;
}

export default function KanbanBoard({ tasks, search, onUpdate }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = useMemo(() => {
    const filtered = tasks.filter((t) => matchSearch(t, search));
    return Object.fromEntries(
      COLUMNS.map((col) => [
        col.status,
        sortTasks(filtered.filter((t) => t.status === col.status)),
      ])
    ) as Record<Status, Task[]>;
  }, [tasks, search]);

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      const task = tasks.find((t) => t.id === event.active.id);
      setActiveTask(task ?? null);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;
      const newStatus = over.id as Status;
      const task = tasks.find((t) => t.id === active.id);
      if (!task || task.status === newStatus) return;
      await updateTaskStatus(task.id, newStatus);
      onUpdate();
    },
    [tasks, onUpdate]
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 px-4 py-4 items-start overflow-x-auto flex-1 h-full md:grid md:grid-cols-5 md:overflow-x-visible">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            column={col}
            tasks={grouped[col.status] ?? []}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
            <KanbanCard task={activeTask} onUpdate={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
