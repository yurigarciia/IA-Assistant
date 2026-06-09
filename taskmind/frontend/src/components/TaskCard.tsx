"use client";

import { useState } from "react";
import type { Task } from "@/types/task";
import { completeTask, commentTask } from "@/lib/api";

const URGENCIA_COLORS = {
  critica: "bg-red-500",
  alta: "bg-orange-500",
  media: "bg-yellow-500",
  baixa: "bg-green-500",
};

const URGENCIA_LABELS = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

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

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-2 ${isConcluida ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${URGENCIA_COLORS[task.urgencia]}`} title={URGENCIA_LABELS[task.urgencia]} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm leading-snug ${isConcluida ? "line-through text-gray-500" : "text-gray-100"}`}>
            {task.titulo}
          </p>
          {task.projeto && (
            <p className="text-xs text-gray-500 mt-0.5">{task.projeto}</p>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {!isConcluida && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setShowComment((v) => !v)}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
              title="Comentar"
            >
              💬
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-green-400 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
              title="Marcar como feito"
            >
              ✓
            </button>
          </div>
        )}
      </div>

      {showComment && (
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            autoFocus
          />
          <button
            onClick={handleComment}
            disabled={loading}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
