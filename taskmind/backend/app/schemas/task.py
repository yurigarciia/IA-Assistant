import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel

Urgencia = Literal["baixa", "media", "alta", "critica"]
Status = Literal["aberta", "em_andamento", "concluida", "arquivada"]


class InteractionOut(BaseModel):
    id: uuid.UUID
    tipo: str
    conteudo: str | None
    criada_em: datetime

    model_config = {"from_attributes": True}


class TaskBase(BaseModel):
    titulo: str
    descricao: str | None = None
    urgencia: Urgencia = "media"
    projeto: str | None = None
    tags: list[str] | None = None
    prazo_inf: datetime | None = None


class TaskCreate(TaskBase):
    pass


class TaskIngest(BaseModel):
    texto: str


class TaskUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    urgencia: Urgencia | None = None
    status: Status | None = None
    projeto: str | None = None
    tags: list[str] | None = None
    prazo_inf: datetime | None = None
    pressao: bool | None = None


class TaskOut(TaskBase):
    id: uuid.UUID
    status: Status
    pressao: bool
    criada_em: datetime
    atualizada_em: datetime
    concluida_em: datetime | None
    interactions: list[InteractionOut] = []

    model_config = {"from_attributes": True}


class CommentIn(BaseModel):
    conteudo: str


class IngestResult(BaseModel):
    task: TaskOut
    ai_raw: dict | None = None
