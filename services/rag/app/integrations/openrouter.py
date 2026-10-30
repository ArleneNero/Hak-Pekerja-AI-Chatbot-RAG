"""
Klien integrasi API untuk Embedding (OpenRouter) dan Chat LLM (Bariska Cloud / OpenRouter).
Menerapkan retry bertahap untuk transient error, sanitasi error, dan penanganan respons kosong.
"""
import random
import time
from typing import List, Tuple, Dict, Any
import numpy as np
import httpx
from app.core.config import settings

TRANSIENT_HTTP = {408, 409, 425, 429, 500, 502, 503, 504}


def extract_chat_text(data: dict) -> Tuple[str, str]:
    """Mengekstrak teks respons dari struktur payload completions OpenAI-compatible."""
    choices = data.get("choices") or []
    if not choices:
        return "", "no_choices"
    choice = choices[0] or {}
    message = choice.get("message") or {}
    content = message.get("content")
    if isinstance(content, str):
        text = content.strip()
    elif isinstance(content, list):
        text = "\n".join(p.get("text", "") for p in content if isinstance(p, dict)).strip()
    elif not content and message.get("reasoning_content"):
        # Dukungan ekstraksi konten penalaran jika model menaruh jawaban di reasoning_content
        text = str(message.get("reasoning_content")).strip()
    else:
        text = ""
    return text, choice.get("finish_reason", "unknown")


def embed_texts(texts: List[str], max_attempts: int = 4) -> np.ndarray:
    """
    Membuat embedding teks menggunakan endpoint /embeddings.
    Memvalidasi dimensi vektor hasil sama dengan settings.vector_dim (1024).
    """
    if not texts or any(not isinstance(x, str) or not x.strip() for x in texts):
        raise ValueError("Input embedding harus berupa teks nonkosong.")

    headers = {
        "Authorization": f"Bearer {settings.embedding_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hakpekerja.ai",
        "X-Title": "HakPekerja.AI RAG Service",
    }
    payload = {
        "model": settings.embedding_model,
        "input": texts,
        "encoding_format": "float"
    }

    last_error = "unknown error"
    for attempt in range(max_attempts):
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    f"{settings.embedding_base_url}/embeddings",
                    json=payload,
                    headers=headers
                )

            if resp.status_code == 200:
                data = resp.json()
                rows = sorted(data.get("data") or [], key=lambda x: x.get("index", 0))
                if len(rows) != len(texts):
                    raise RuntimeError(f"Embedding tidak lengkap: {len(rows)}/{len(texts)}")
                arr = np.asarray([row.get("embedding") for row in rows], dtype=np.float32)
                if arr.ndim != 2 or arr.shape[1] != settings.vector_dim or not np.isfinite(arr).all():
                    raise RuntimeError(
                        f"Dimensi embedding invalid: shape={arr.shape}, seharusnya ({len(texts)}, {settings.vector_dim})"
                    )
                return arr

            detail = resp.text[:200]
            last_error = f"HTTP {resp.status_code}: {detail}"
            if resp.status_code not in TRANSIENT_HTTP:
                break

            delay = min(2 * (2 ** attempt) + random.random(), 15)
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {str(exc)}"
            delay = min(2 * (2 ** attempt) + random.random(), 15)

        if attempt + 1 < max_attempts:
            time.sleep(delay)

    raise RuntimeError(f"Embedding API gagal setelah {max_attempts} percobaan: {last_error}")


def chat_complete(
    messages: List[Dict[str, str]],
    max_tokens: int = 1200,
    attempts: int = 2
) -> Tuple[str, List[dict]]:
    """
    Meminta generasi teks jawaban dari model chat LLM (DeepSeek di Bariska Cloud).
    Mengakomodasi reasoning model yang membutuhkan ruang token untuk berpikir.
    Jika provider utama sibuk (server_busy / load spike / rate limit), otomatis fallback ke OpenRouter.
    """
    capped_tokens = min(max_tokens, 1200)
    primary_headers = {
        "Authorization": f"Bearer {settings.chat_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hakpekerja.ai",
        "X-Title": "HakPekerja.AI RAG Service",
    }
    primary_payload = {
        "model": settings.chat_model,
        "messages": messages,
        "temperature": 0.05,
        "max_tokens": capped_tokens,
    }

    diagnostics = []
    last_error = "unknown error"
    should_fallback_now = False

    for attempt in range(1, attempts + 1):
        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(
                    f"{settings.chat_base_url}/chat/completions",
                    json=primary_payload,
                    headers=primary_headers
                )

            if resp.status_code == 200:
                data = resp.json()
                if "error" in data:
                    err_info = data["error"]
                    err_msg = err_info.get("message", str(err_info)) if isinstance(err_info, dict) else str(err_info)
                    last_error = f"Primary API error: {err_msg}"
                    # Deteksi jika provider utama sedang kelebihan beban
                    if any(kw in err_msg.lower() for kw in ["heavy load", "slowed down", "rate_limit", "server_busy", "overloaded"]):
                        should_fallback_now = True
                        break
                else:
                    text, finish = extract_chat_text(data)
                    diagnostics.append({"provider": "primary", "attempt": attempt, "finish_reason": finish, "has_text": bool(text)})
                    if text:
                        return text, diagnostics

                    # Cek jika model reasoning kehabisan token sebelum menghasilkan konten
                    choice = (data.get("choices") or [{}])[0]
                    if finish == "length" and choice.get("message", {}).get("reasoning_content"):
                        last_error = "Model reasoning kehabisan max_tokens sebelum selesai berpikir"
                    else:
                        last_error = "Respons chat model kosong"
            else:
                detail = resp.text[:200]
                last_error = f"HTTP {resp.status_code}: {detail}"
                if resp.status_code == 429 or any(kw in detail.lower() for kw in ["heavy load", "slowed down", "busy", "blocked", "forbidden"]):
                    should_fallback_now = True
                    break
                if resp.status_code not in TRANSIENT_HTTP:
                    should_fallback_now = True
                    break
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {str(exc)}"

        if attempt < attempts and not should_fallback_now:
            time.sleep(1.5 * attempt)

    # Otomatis Fallback ke OpenRouter jika provider utama bermasalah atau kelebihan beban
    fallback_key = settings.chat_fallback_api_key or settings.embedding_api_key
    if fallback_key and settings.chat_fallback_base_url:
        diagnostics.append({"notice": "Failover ke provider cadangan (OpenRouter)", "primary_reason": last_error})
        fallback_headers = {
            "Authorization": f"Bearer {fallback_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hakpekerja.ai",
            "X-Title": "HakPekerja.AI RAG Service (Fallback)",
        }
        
        # Prioritas model fallback di OpenRouter: DeepSeek -> LLaMA 3.3 70B -> Qwen 2.5 72B
        candidate_models = [settings.chat_fallback_model, "meta-llama/llama-3.3-70b-instruct", "qwen/qwen-2.5-72b-instruct"]
        seen_models = set()

        for fb_model in candidate_models:
            if not fb_model or fb_model in seen_models:
                continue
            seen_models.add(fb_model)

            fallback_payload = {
                "model": fb_model,
                "messages": messages,
                "temperature": 0.05,
                "max_tokens": capped_tokens,
            }
            try:
                with httpx.Client(timeout=40.0) as client:
                    fb_resp = client.post(
                        f"{settings.chat_fallback_base_url}/chat/completions",
                        json=fallback_payload,
                        headers=fallback_headers
                    )
                if fb_resp.status_code == 200:
                    fb_data = fb_resp.json()
                    fb_text, fb_finish = extract_chat_text(fb_data)
                    diagnostics.append({"provider": "fallback", "model": fb_model, "finish_reason": fb_finish, "has_text": bool(fb_text)})
                    if fb_text:
                        return fb_text, diagnostics
                    last_error = f"Fallback model {fb_model} respons kosong: {fb_data.get('error') or 'no content'}"
                else:
                    last_error = f"Fallback model {fb_model} HTTP {fb_resp.status_code}: {fb_resp.text[:200]}"
                    # Coba kandidat model fallback berikutnya jika model ini bermasalah
                    continue
            except Exception as fb_exc:
                last_error = f"Fallback model {fb_model} exception: {str(fb_exc)}"
                continue

    raise RuntimeError(f"Chat completion gagal setelah primary & fallback: {last_error}")

