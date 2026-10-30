"""
Uji endpoint HTTP FastAPI (TestClient).
Memastikan /health, /readiness, dan /internal/rag/query berjalan sesuai kontrak.
"""
import sys
from pathlib import Path
from fastapi.testclient import TestClient

RAG_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAG_ROOT))

from main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "service": "hakpekerja-rag"}


def test_readiness():
    resp = client.get("/readiness")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["qdrant_status"] == "green"
    assert data["points_count"] == 6394


def test_internal_rag_query_endpoint():
    payload = {
        "question": "Berapa jam kerja normal karyawan dalam satu minggu?",
        "top_k": 5
    }
    resp = client.post("/internal/rag/query", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in {"answered", "needs_review"}
    assert "answer" in data
    assert len(data["sources"]) > 0
    assert "request_id" in data
    assert "latency_seconds" in data
    print(f"\n[HTTP QUERY RESULT] Status: {data['status']}, Latency: {data['latency_seconds']}s")

