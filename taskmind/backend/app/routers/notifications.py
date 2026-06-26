import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from app.db import get_db
from app.models.task import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID | None
    canal: str
    mensagem: str | None
    enviada_em: datetime
    entregue_tray: bool

    model_config = {"from_attributes": True}


@router.get("/pending", response_model=list[NotificationOut])
async def get_pending(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification)
        .where(Notification.canal == "desktop")
        .where(Notification.entregue_tray == False)  # noqa: E712
        .order_by(Notification.enviada_em)
    )
    return result.scalars().all()


@router.post("/{notification_id}/ack", response_model=NotificationOut)
async def ack_notification(notification_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    notif = await db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    notif.entregue_tray = True
    await db.commit()
    await db.refresh(notif)
    return notif
