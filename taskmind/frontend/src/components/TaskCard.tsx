"use client";

import { useState } from "react";
import type { Task } from "@/types/task";
import { completeTask, commentTask } from "@/lib/api";

const URGENCIA_BADGE: Record<string, string> = {
  critica: "bg-red-500/15 text-red-400 border border-red-500/25",
  alta: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  media: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
  baixa: "bg-green-500/15 text-green-400 border border-green-500/25",
};

const URGENCIA_DOT: Record<string, string> = {
  critica: "bg-red-500",
  alta: "bg-orange-500",
  media: "bg-yellow-500",
  baixa: "bg-green-500",
};

const URGENCIA_LABELS: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

function formatPrazo(iso: string): { label: string; overdue: boolean } {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `Venceu há ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: "Vence hoje", overdue: false };
  if (diffDays === 1) return { label: "Vence amanhã", overdue: false };
  if (diffDays <= 7) return { label: `${diffDays} dias`, overdue: false };
  return {
    label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    overdue: false,
  };
}

interface Props {
  task: Task;
  onUpdate: () => void;
}

export default function TaskCard({ task, onUpdate }: Props) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    await completeTask(task.id);
    onUpdate();
    setLoading(false);
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setLoading(true);
    await commentTask(task.id, comment.trim());
    setComment("");
    setShowComment(false);
    onUpdate();
    setLoading(false);
  }

  const isConcluida = task.status === "concluida";
  const prazo = task.prazo_inf ? formatPrazo(task.prazo_inf) : null;

  return (
    <div
      className={`bg-gray-900 border rounded-lg p-4 flex flex-col gap-2 transition-opacity ${
        isConcluida ? "opacity-50 border-gray-800/60" : "border-gray-800 hover:border-gray-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Dot */}
        <span
          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${URGENCIA_DOT[task.urgencia]}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm leading-snug ${
              isConcluida ? "line-through text-gray-500" : "text-gray-100"
            }`}
          >
            {task.titulo}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${URGENCIA_BADGE[task.urgencia]}`}>
              {URGENCIA_LABELS[task.urgencia]}
            </span>

            {task.projeto && (
              <span className="text-xs text-gray-500">{task.projeto}</span>
            )}

            {prazo && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  prazo.overdue ? "text-red-400" : "text-gray-500"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {prazo.label}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isConcluida && (
          <div className="flex gap-1 flex-shrink-0 ml-1">
            <button
              onClick={() => setShowComment((v) => !v)}
              disabled={loading}
              className="text-gray-500 hover:text-gray-300 p-1.5 rounded hover:bg-gray-800 transition-colors"
              title="Comentar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="text-gray-500 hover:text-green-400 p-1.5 rounded hover:bg-gray-800 transition-colors"
              title="Marcar como feito"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Comment input */}
      {showComment && (
        <div className="flex gap-2 mt-1 pl-5">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
            autoFocus
          />
          <button
            onClick={handleComment}
            disabled={loading || !comment.trim()}
            className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors text-gray-200"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
