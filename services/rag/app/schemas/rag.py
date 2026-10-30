"""
Skema data Pydantic (DTO) untuk Service RAG.
Sesuai dengan kontrak pada Pedoman Standar Frontend V4 & Backend Gate.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

RagStatus = Literal[
    "answered",
    "insufficient_evidence",
    "needs_review",
    "out_of_scope",
    "invalid_question",
    "service_unavailable"
]


class LegalSourceDto(BaseModel):
    label: Optional[str] = Field(None, description="Label rujukan seperti S1, S2")
    document_id: str = Field(..., description="ID dokumen hukum, misal PP_35_2021")
    title: str = Field(..., description="Judul lengkap dokumen hukum")
    official_url: str = Field(..., description="Tautan resmi JDIH/BPK")
    article: Optional[str] = Field(None, description="Nomor pasal jika terverifikasi")
    page: Optional[int] = Field(None, description="Halaman PDF dokumen")
    source_section: Optional[str] = Field(None, description="Bagian/lampiran/pasal")
    score: Optional[float] = Field(None, description="Skor kemiripan pencarian vektor")


class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1500, description="Pertanyaan hukum ketenagakerjaan")
    conversation_id: Optional[str] = Field(None, description="ID percakapan opsional")
    top_k: Optional[int] = Field(None, ge=1, le=15, description="Jumlah konteks dokumen yang diambil")
    history: Optional[List[dict]] = Field(default_factory=list, description="Riwayat percakapan sebelumnya")


class RagQueryResponse(BaseModel):
    status: RagStatus = Field(..., description="Status hasil penalaran RAG")
    answer: str = Field(..., description="Teks jawaban hukum atau pesan penolakan yang aman")
    sources: List[LegalSourceDto] = Field(default_factory=list, description="Daftar rujukan hukum resmi yang terverifikasi")
    request_id: str = Field(..., description="ID pelacakan unik untuk request ini")
    latency_seconds: float = Field(..., description="Durasi pemrosesan dalam detik")
    diagnostics: Optional[dict] = Field(None, description="Informasi diagnostik teknis internal")


class HealthResponse(BaseModel):
    status: str
    service: str = "hakpekerja-rag"
    qdrant_status: str
    collection: str
    points_count: int

