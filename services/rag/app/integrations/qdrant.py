"""
Integrasi klien Qdrant Cloud (Read-Only).
Memastikan operasi query vektor aman tanpa create/upsert/delete di jalur runtime.
"""
from typing import List, Optional
from qdrant_client import QdrantClient, models
from app.core.config import settings

_client: Optional[QdrantClient] = None


def get_qdrant_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30,
            prefer_grpc=False
        )
    return _client


def verify_qdrant_collection() -> dict:
    """Memverifikasi koleksi aktif dan memastikan dimensi vektor cocok (fail-fast)."""
    qc = get_qdrant_client()
    info = qc.get_collection(settings.qdrant_collection)
    vectors_cfg = info.config.params.vectors
    remote_dim = vectors_cfg.size if hasattr(vectors_cfg, "size") else None

    if remote_dim != settings.vector_dim:
        raise RuntimeError(
            f"Dimensi koleksi Qdrant ({remote_dim}) tidak cocok dengan konfigurasi ({settings.vector_dim})."
        )
    if info.points_count <= 0:
        raise RuntimeError(f"Koleksi Qdrant '{settings.qdrant_collection}' tidak memiliki data (0 points).")

    return {
        "status": str(info.status),
        "collection": settings.qdrant_collection,
        "points_count": info.points_count,
        "vector_dim": remote_dim
    }


def query_points(vector: List[float], limit: int, query_filter: Optional[models.Filter] = None):
    """Pencarian vektor read-only terhadap koleksi Qdrant aktif dengan reconnect jika socket terputus."""
    global _client
    for attempt in range(2):
        qc = get_qdrant_client()
        try:
            if hasattr(qc, "query_points"):
                result = qc.query_points(
                    collection_name=settings.qdrant_collection,
                    query=vector,
                    query_filter=query_filter,
                    limit=limit,
                    with_payload=True,
                    with_vectors=False
                )
                return list(result.points)
            return list(
                qc.search(
                    collection_name=settings.qdrant_collection,
                    query_vector=vector,
                    query_filter=query_filter,
                    limit=limit,
                    with_payload=True,
                    with_vectors=False
                )
            )
        except Exception:
            _client = None  # Reset client agar reconnect
            if attempt == 1:
                raise

