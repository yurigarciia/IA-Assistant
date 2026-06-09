import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskIngest, CommentIn, IngestResult
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    status: str | None = Query(None),
    urgencia: str | None = Query(None),
    projeto: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.list_tasks(db, status=status, urgencia=urgencia, projeto=projeto)


@router.post("", response_model=TaskOut, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    return await task_service.create_task(db, data)


@router.post("/ingest", response_model=IngestResult, status_code=201)
async def ingest_task(data: TaskIngest, db: AsyncSession = Depends(get_db)):
    from app.services.ai_service import parse_task
    parsed, ai_raw = await parse_task(data.texto)
    task = await task_service.create_task(db, parsed)
    return IngestResult(task=TaskOut.model_validate(task), ai_raw=ai_raw)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: uuid.UUID, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return await task_service.update_task(db, task, data)


@router.post("/{task_id}/complete", response_model=TaskOut)
async def complete_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return await task_service.complete_task(db, task)


@router.post("/{task_id}/comment", response_model=TaskOut)
async def comment_task(task_id: uuid.UUID, data: CommentIn, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    await task_service.add_comment(db, task, data.conteudo)
    return await task_service.get_task(db, task_id)
