import type { Status } from "@/types/task";

export const COLUMNS: { status: Status; label: string; color: string; dot: string }[] = [
  { status: "aberta",       label: "Aberta",       color: "text-gray-400",   dot: "bg-gray-500" },
  { status: "em_progresso", label: "Em progresso", color: "text-blue-400",   dot: "bg-blue-500" },
  { status: "aguardando",   label: "Aguardando",   color: "text-amber-400",  dot: "bg-amber-500" },
  { status: "revisando",    label: "Revisando",    color: "text-purple-400", dot: "bg-purple-500" },
  { status: "concluida",    label: "Concluída",    color: "text-green-400",  dot: "bg-green-500" },
];
