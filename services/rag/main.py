"""
Entry point server FastAPI HakPekerja.AI RAG Service.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router
from app.integrations.qdrant import verify_qdrant_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation: verifikasi Qdrant collection aktif
    print("Mengecek koneksi ke Qdrant cluster...")
    try:
        info = verify_qdrant_collection()
        print(f"SUCCESS: Qdrant siap! Collection={info['collection']}, Points={info['points_count']}")
    except Exception as e:
        print(f"WARNING: Gagal memverifikasi Qdrant saat startup: {e}")
    yield
    print("RAG Service shutting down.")


app = FastAPI(
    title="HakPekerja.AI RAG Service",
    description="Private internal service for legal labor retrieval and grounded LLM reasoning.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware (hanya untuk internal/dev lokal)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=(settings.environment == "development")
    )

