export type Urgencia = "baixa" | "media" | "alta" | "critica";
export type Status = "aberta" | "em_progresso" | "aguardando" | "revisando" | "concluida";

export interface Interaction {
  id: string;
  tipo: string;
  conteudo: string | null;
  criada_em: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  urgencia: Urgencia;
  status: Status;
  projeto: string | null;
  tags: string[] | null;
  prazo_inf: string | null;
  pressao: boolean;
  criada_em: string;
  atualizada_em: string;
  concluida_em: string | null;
  interactions: Interaction[];
}
