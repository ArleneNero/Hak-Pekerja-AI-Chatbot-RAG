"""
Konfigurasi Environment dan Settings untuk Service RAG.
Menggunakan Pydantic Settings untuk validasi fail-fast saat startup.
"""
from pathlib import Path
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Jalur pencarian file .env
CURRENT_DIR = Path(__file__).resolve().parent
RAG_ROOT_DIR = CURRENT_DIR.parent.parent
ENV_FILE = RAG_ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # 1. Qdrant
    qdrant_url: str = Field(..., alias="QDRANT_URL")
    qdrant_api_key: str = Field(..., alias="QDRANT_API_KEY")
    qdrant_collection: str = Field("hakpekerja_legal_4b4babc70203", alias="QDRANT_COLLECTION")

    # 2. Chat LLM (Bariska Cloud / OpenRouter)
    chat_base_url: str = Field("https://api.bariska.cloud/v1", alias="CHAT_BASE_URL")
    chat_api_key: str = Field(..., alias="CHAT_API_KEY")
    chat_model: str = Field("deepseek-v4.1-flash", alias="CHAT_MODEL")
    chat_fallback_base_url: str = Field("https://openrouter.ai/api/v1", alias="CHAT_FALLBACK_BASE_URL")
    chat_fallback_api_key: Optional[str] = Field(None, alias="CHAT_FALLBACK_API_KEY")
    chat_fallback_model: str = Field("deepseek/deepseek-chat", alias="CHAT_FALLBACK_MODEL")

    # 3. Embedding (OpenRouter / baai/bge-m3)
    embedding_base_url: str = Field("https://openrouter.ai/api/v1", alias="EMBEDDING_BASE_URL")
    embedding_api_key: str = Field(..., alias="EMBEDDING_API_KEY")
    embedding_model: str = Field("baai/bge-m3", alias="EMBEDDING_MODEL")
    vector_dim: int = Field(1024, alias="VECTOR_DIM")
    top_k: int = Field(7, alias="TOP_K")

    # 4. Runtime
    host: str = Field("127.0.0.1", alias="HOST")
    port: int = Field(8001, alias="PORT")
    environment: str = Field("development", alias="ENVIRONMENT")

    @field_validator("qdrant_url", "chat_base_url", "embedding_base_url", "chat_fallback_base_url")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")


# Singleton settings instance
settings = Settings()

