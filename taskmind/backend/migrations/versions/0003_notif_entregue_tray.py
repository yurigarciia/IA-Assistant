"""add entregue_tray to notifications

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("entregue_tray", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("notifications", "entregue_tray")
