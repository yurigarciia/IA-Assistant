"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/types/task";
import type { ColumnDef } from "@/lib/columns";
import KanbanCard from "@/components/KanbanCard";

interface Props {
  column: ColumnDef;
  tasks: Task[];
  onUpdate: () => void;
}

export default function KanbanColumn({ column, tasks, onUpdate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 ${column.headerBg}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${column.dot}`} />
        <span className={`text-xs font-semibold tracking-wide ${column.color}`}>
          {column.label}
        </span>
        <span className="ml-auto text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 p-2 min-h-[160px] flex-1 transition-colors rounded-b-xl ${
          isOver ? "bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/20" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-xs text-zinc-700 select-none">Solte aqui</span>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onUpdate={onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}
