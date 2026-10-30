"""
Route handler HTTP internal untuk Service RAG.
Endpoint ini dirancang untuk dipanggil secara internal oleh backend Express (apps/api).
"""
import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.rag import RagQueryRequest, RagQueryResponse, HealthResponse
from app.rag.engine import ask_rag
from app.integrations.qdrant import verify_qdrant_collection
from app.core.config import settings

router = APIRouter()


@router.post("/internal/rag/query", response_model=RagQueryResponse)
async def query_rag(req: RagQueryRequest):
    """
    Endpoint internal untuk mengeksekusi pipeline RAG:
    Embedding -> Qdrant Retrieval -> Context Assembly -> Chat LLM -> Citation Verification.
    """
    request_id = str(uuid.uuid4())
    try:
        response = ask_rag(
            question=req.question,
            top_k=req.top_k or settings.top_k,
            request_id=request_id,
            history=req.history
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan internal pada layanan RAG: {str(exc)[:300]}"
        )


@router.get("/health")
async def health_check():
    """Liveness probe sederhana tanpa membuka kredensial rahasia."""
    return {"status": "ok", "service": "hakpekerja-rag"}


@router.get("/readiness", response_model=HealthResponse)
async def readiness_check():
    """Readiness probe yang memverifikasi kesiapan koneksi ke Qdrant cluster."""
    try:
        qdrant_info = verify_qdrant_collection()
        return HealthResponse(
            status="ready",
            service="hakpekerja-rag",
            qdrant_status=qdrant_info["status"],
            collection=qdrant_info["collection"],
            points_count=qdrant_info["points_count"]
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Layanan RAG belum siap terhubung ke Qdrant: {str(exc)}"
        )

