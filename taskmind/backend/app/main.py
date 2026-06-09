from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tasks

app = FastAPI(title="TaskMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(tasks.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
