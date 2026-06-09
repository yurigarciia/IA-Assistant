"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("titulo", sa.Text, nullable=False),
        sa.Column("descricao", sa.Text),
        sa.Column("urgencia", sa.String(10), server_default="media"),
        sa.Column("status", sa.String(20), server_default="aberta"),
        sa.Column("projeto", sa.Text),
        sa.Column("tags", ARRAY(sa.Text)),
        sa.Column("prazo_inf", sa.TIMESTAMP(timezone=True)),
        sa.Column("pressao", sa.Boolean, server_default="true"),
        sa.Column("criada_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("atualizada_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("concluida_em", sa.TIMESTAMP(timezone=True)),
    )

    op.create_table(
        "interactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_id", UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tipo", sa.String(20)),
        sa.Column("conteudo", sa.Text),
        sa.Column("criada_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "ai_context",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_id", UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("modelo", sa.Text),
        sa.Column("prompt", sa.Text),
        sa.Column("resposta", sa.Text),
        sa.Column("criada_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_id", UUID(as_uuid=True), sa.ForeignKey("tasks.id")),
        sa.Column("canal", sa.String(20)),
        sa.Column("mensagem", sa.Text),
        sa.Column("enviada_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("respondida", sa.Boolean, server_default="false"),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("ai_context")
    op.drop_table("interactions")
    op.drop_table("tasks")
