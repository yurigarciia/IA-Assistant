import type { Task, Status } from "@/types/task";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchTasks(params?: {
  status?: string;
  urgencia?: string;
  projeto?: string;
}): Promise<Task[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.urgencia) qs.set("urgencia", params.urgencia);
  if (params?.projeto) qs.set("projeto", params.projeto);
  const res = await fetch(`${BASE}/api/tasks?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao buscar tarefas");
  return res.json();
}

export async function ingestTask(texto: string): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
  if (!res.ok) throw new Error("Erro ao criar tarefa");
  const data = await res.json();
  return data.task;
}

export async function updateTaskStatus(id: string, status: Status): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar status");
  return res.json();
}

export async function commentTask(id: string, conteudo: string): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/${id}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conteudo }),
  });
  if (!res.ok) throw new Error("Erro ao comentar tarefa");
  return res.json();
}
