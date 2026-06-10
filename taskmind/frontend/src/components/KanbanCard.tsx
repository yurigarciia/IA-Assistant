"use client";

import { useState } from "react";
import type { Task, Status } from "@/types/task";
import { commentTask } from "@/lib/api";
import { COLUMNS } from "@/lib/columns";

const URGENCIA_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  critica: { bg: "bg-red-500/10",    text: "text-red-400",    label: "Crítica" },
  alta:    { bg: "bg-orange-500/10", text: "text-orange-400", label: "Alta" },
  media:   { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Média" },
  baixa:   { bg: "bg-green-500/10",  text: "text-green-400",  label: "Baixa" },
};

function formatPrazo(iso: string): { label: string; overdue: boolean } {
  const date = new Date(iso);
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return { label: `Venceu há ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: "Hoje", overdue: false };
  if (diffDays === 1) return { label: "Amanhã", overdue: false };
  if (diffDays <= 7) return { label: `${diffDays}d`, overdue: false };
  return { label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), overdue: false };
}

interface Props {
  task: Task;
  onMove: (id: string, status: Status) => Promise<void>;
  onUpdate: () => void;
  moving: boolean;
}

export default function KanbanCard({ task, onMove, onUpdate, moving }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

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
      className={`group relative rounded-lg border bg-white/[0.03] p-3 flex flex-col gap-2 transition-all ${
        moving
          ? "opacity-40 pointer-events-none"
          : isConcluida
          ? "border-white/[0.04] opacity-60"
          : "border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.05]"
      }`}
    >
      {/* Title */}
      <p className={`text-sm leading-snug font-medium ${isConcluida ? "line-through text-gray-500" : "text-gray-100"}`}>
        {task.titulo}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm ${urgencia.bg} ${urgencia.text}`}>
          {urgencia.label}
        </span>

        {task.projeto && (
          <span className="text-[11px] text-gray-500">{task.projeto}</span>
        )}

        {prazo && (
          <span className={`flex items-center gap-1 text-[11px] ${prazo.overdue ? "text-red-400" : "text-gray-500"}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {prazo.label}
          </span>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {task.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-gray-600 bg-white/[0.04] px-1 py-0.5 rounded-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {!isConcluida && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move to */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 rounded transition-colors"
            >
              Mover para
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-[#111] border border-white/10 rounded-lg shadow-2xl overflow-hidden w-44">
                  {COLUMNS.filter((c) => c.status !== task.status).map((col) => (
                    <button
                      key={col.status}
                      onClick={() => { setShowMenu(false); onMove(task.id, col.status); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.dot}`} />
                      {col.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowComment((v) => !v)}
            className="text-gray-600 hover:text-gray-300 p-1 rounded hover:bg-white/[0.06] transition-colors"
            title="Comentar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      )}

      {/* Comment input */}
      {showComment && (
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Comentário..."
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/20"
            autoFocus
          />
          <button
            onClick={handleComment}
            disabled={saving || !comment.trim()}
            className="text-xs bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 px-2.5 py-1.5 rounded text-gray-300 transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
