import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, ARRAY, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(Text, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    urgencia: Mapped[str] = mapped_column(String(10), default="media")  # baixa, media, alta, critica
    status: Mapped[str] = mapped_column(String(20), default="aberta")   # aberta, em_andamento, concluida, arquivada
    projeto: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    prazo_inf: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    pressao: Mapped[bool] = mapped_column(Boolean, default=True)
    criada_em: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    atualizada_em: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    concluida_em: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    ultimo_lembrete_em: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    interactions: Mapped[list["Interaction"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    ai_contexts: Mapped[list["AiContext"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="task")


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    tipo: Mapped[str] = mapped_column(String(20))  # comentario, status_change, lembrete_enviado
    conteudo: Mapped[str | None] = mapped_column(Text)
    criada_em: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship(back_populates="interactions")


class AiContext(Base):
    __tablename__ = "ai_context"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    modelo: Mapped[str | None] = mapped_column(Text)
    prompt: Mapped[str | None] = mapped_column(Text)
    resposta: Mapped[str | None] = mapped_column(Text)
    criada_em: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship(back_populates="ai_contexts")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id"))
    canal: Mapped[str] = mapped_column(String(20))  # telegram, teams, desktop
    mensagem: Mapped[str | None] = mapped_column(Text)
    enviada_em: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    respondida: Mapped[bool] = mapped_column(Boolean, default=False)
    entregue_tray: Mapped[bool] = mapped_column(Boolean, default=False)

    task: Mapped["Task | None"] = relationship(back_populates="notifications")
