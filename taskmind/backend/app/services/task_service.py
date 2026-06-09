import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.task import Task, Interaction
from app.schemas.task import TaskCreate, TaskUpdate


async def list_tasks(
    db: AsyncSession,
    status: str | None = None,
    urgencia: str | None = None,
    projeto: str | None = None,
) -> list[Task]:
    q = select(Task).order_by(desc(Task.criada_em))
    if status:
        q = q.where(Task.status == status)
    if urgencia:
        q = q.where(Task.urgencia == urgencia)
    if projeto:
        q = q.where(Task.projeto == projeto)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, data: TaskCreate) -> Task:
    task = Task(**data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(db: AsyncSession, task: Task, data: TaskUpdate) -> Task:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def complete_task(db: AsyncSession, task: Task) -> Task:
    task.status = "concluida"
    task.concluida_em = datetime.now(timezone.utc)
    interaction = Interaction(task_id=task.id, tipo="status_change", conteudo="Tarefa marcada como concluída")
    db.add(interaction)
    await db.commit()
    await db.refresh(task)
    return task


async def add_comment(db: AsyncSession, task: Task, conteudo: str) -> Interaction:
    interaction = Interaction(task_id=task.id, tipo="comentario", conteudo=conteudo)
    db.add(interaction)
    task.atualizada_em = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(interaction)
    return interaction
