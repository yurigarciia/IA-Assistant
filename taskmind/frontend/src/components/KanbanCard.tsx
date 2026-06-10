"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";
import { commentTask } from "@/lib/api";

const URGENCIA_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  critica: { bg: "bg-red-500/20",    text: "text-red-300",    label: "Crítica" },
  alta:    { bg: "bg-orange-500/20", text: "text-orange-300", label: "Alta" },
  media:   { bg: "bg-yellow-500/20", text: "text-yellow-300", label: "Média" },
  baixa:   { bg: "bg-green-500/20",  text: "text-green-300",  label: "Baixa" },
};

function formatPrazo(iso: string): { label: string; overdue: boolean } {
  const diffDays = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diffDays < 0)  return { label: `Venceu há ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: "Hoje", overdue: false };
  if (diffDays === 1) return { label: "Amanhã", overdue: false };
  if (diffDays <= 7)  return { label: `${diffDays}d`, overdue: false };
  return {
    label: new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    overdue: false,
  };
}

interface Props {
  task: Task;
  onUpdate: () => void;
}

export default function KanbanCard({ task, onUpdate }: Props) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
    disabled: task.status === "concluida",
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const urgencia = URGENCIA_BADGE[task.urgencia];
  const prazo = task.prazo_inf ? formatPrazo(task.prazo_inf) : null;
  const isConcluida = task.status === "concluida";

  async function handleComment() {
    if (!comment.trim()) return;
    setSaving(true);
    await commentTask(task.id, comment.trim());
    setComment("");
    setShowComment(false);
    onUpdate();
    setSaving(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border flex flex-col gap-2.5 p-3 transition-all select-none ${
        isDragging
          ? "opacity-50 shadow-2xl border-indigo-500/60 bg-zinc-700 z-50"
          : isConcluida
          ? "border-zinc-800 bg-zinc-900/50 opacity-60 cursor-default"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 cursor-grab active:cursor-grabbing"
      }`}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-2">
        {!isConcluida && (
          <div
            {...listeners}
            {...attributes}
            className="mt-0.5 flex-shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Arrastar"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </div>
        )}
        <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${
          isConcluida ? "line-through text-zinc-500" : "text-zinc-100"
        }`}>
          {task.titulo}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pl-5">
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${urgencia.bg} ${urgencia.text}`}>
          {urgencia.label}
        </span>

        {task.projeto && (
          <span className="text-[11px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {task.projeto}
          </span>
        )}

        {prazo && (
          <span className={`flex items-center gap-1 text-[11px] font-medium ${
            prazo.overdue ? "text-red-400" : "text-zinc-500"
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {prazo.label}
          </span>
        )}

        {task.tags && task.tags.length > 0 && task.tags.map((tag) => (
          <span key={tag} className="text-[11px] text-zinc-600 bg-zinc-800/60 px-1 py-0.5 rounded">
            #{tag}
          </span>
        ))}
      </div>

      {/* Comment button */}
      {!isConcluida && (
        <div className="pl-5 flex">
          <button
            onClick={() => setShowComment((v) => !v)}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comentar
          </button>
        </div>
      )}

      {showComment && (
        <div className="flex gap-1.5 pl-5">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Comentário..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          <button
            onClick={handleComment}
            disabled={saving || !comment.trim()}
            className="text-xs bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-2.5 py-1.5 rounded text-zinc-200 transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
