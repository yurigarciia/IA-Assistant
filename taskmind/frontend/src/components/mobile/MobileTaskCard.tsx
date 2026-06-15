"use client";

import { useState } from "react";
import type { Task, Status } from "@/types/task";
import { commentTask, updateTaskStatus } from "@/lib/api";
import MobileStatusSheet from "./MobileStatusSheet";

const URGENCIA_DOT: Record<string, string> = {
  critica: "bg-red-400",
  alta:    "bg-orange-400",
  media:   "bg-yellow-400",
  baixa:   "bg-green-400",
};

const URGENCIA_LABEL: Record<string, string> = {
  critica: "text-red-300",
  alta:    "text-orange-300",
  media:   "text-yellow-300",
  baixa:   "text-green-300",
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

export default function MobileTaskCard({ task, onUpdate }: Props) {
  const [showSheet, setShowSheet]   = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [moving, setMoving]         = useState(false);

  const prazo      = task.prazo_inf ? formatPrazo(task.prazo_inf) : null;
  const isConcluida = task.status === "concluida";

  async function handleMoveStatus(newStatus: Status) {
    setShowSheet(false);
    if (newStatus === task.status) return;
    setMoving(true);
    await updateTaskStatus(task.id, newStatus);
    onUpdate();
    setMoving(false);
  }

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
    <>
      <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-opacity ${
        isConcluida
          ? "border-zinc-800 bg-zinc-900/40 opacity-60"
          : moving
          ? "border-zinc-700 bg-zinc-900 opacity-50"
          : "border-zinc-700 bg-zinc-900"
      }`}>
        {/* Header: urgência dot + título */}
        <div className="flex items-start gap-3">
          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${URGENCIA_DOT[task.urgencia]}`} />
          <p className={`text-sm font-medium leading-snug flex-1 ${
            isConcluida ? "line-through text-zinc-500" : "text-zinc-100"
          }`}>
            {task.titulo}
          </p>
        </div>

        {/* Meta: projeto, prazo, tags */}
        <div className="flex flex-wrap items-center gap-1.5 pl-5">
          <span className={`text-xs font-semibold ${URGENCIA_LABEL[task.urgencia]}`}>
            {task.urgencia.charAt(0).toUpperCase() + task.urgencia.slice(1)}
          </span>

          {task.projeto && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
              {task.projeto}
            </span>
          )}

          {prazo && (
            <span className={`text-xs font-medium flex items-center gap-1 ${
              prazo.overdue ? "text-red-400" : "text-zinc-500"
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {prazo.label}
            </span>
          )}

          {task.tags?.map((tag) => (
            <span key={tag} className="text-xs text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>

        {/* Ações */}
        {!isConcluida && (
          <div className="flex items-center gap-2 pl-5">
            <button
              onClick={() => setShowSheet(true)}
              disabled={moving}
              className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg active:bg-indigo-500/20 transition-colors disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {moving ? "Movendo..." : "Mover"}
            </button>

            <button
              onClick={() => setShowComment((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-800/60 border border-zinc-700/60 px-3 py-1.5 rounded-lg active:bg-zinc-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comentar
            </button>
          </div>
        )}

        {showComment && (
          <div className="flex gap-2 pl-5">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Comentário..."
              autoFocus
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <button
              onClick={handleComment}
              disabled={saving || !comment.trim()}
              className="text-sm bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-3 py-2 rounded-lg text-zinc-200 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {showSheet && (
        <MobileStatusSheet
          currentStatus={task.status}
          onSelect={handleMoveStatus}
          onClose={() => setShowSheet(false)}
        />
      )}
    </>
  );
}
