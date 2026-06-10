import type { Status } from "@/types/task";

export interface ColumnDef {
  status: Status;
  label: string;
  color: string;
  dot: string;
  headerBg: string;
}

export const COLUMNS: ColumnDef[] = [
  { status: "aberta",       label: "Aberta",       color: "text-zinc-300",   dot: "bg-zinc-400",   headerBg: "" },
  { status: "em_progresso", label: "Em progresso", color: "text-blue-300",   dot: "bg-blue-400",   headerBg: "bg-blue-950/30" },
  { status: "aguardando",   label: "Aguardando",   color: "text-amber-300",  dot: "bg-amber-400",  headerBg: "bg-amber-950/30" },
  { status: "revisando",    label: "Revisando",    color: "text-purple-300", dot: "bg-purple-400", headerBg: "bg-purple-950/30" },
  { status: "concluida",    label: "Concluída",    color: "text-green-300",  dot: "bg-green-400",  headerBg: "bg-green-950/30" },
];
