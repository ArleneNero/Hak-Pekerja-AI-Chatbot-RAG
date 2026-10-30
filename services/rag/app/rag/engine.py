"""
Mesin RAG HakPekerja.AI.
Adaptasi fungsi runtime dari HakPekerja_AI_RAG_Clean.ipynb:
- Normalisasi & perutean topik regulasi
- Retrieval vektor Qdrant dengan filter & reranking
- Pembentukan konteks berbasis bukti
- Validasi groundedness (sitasi & angka)
- Domain guard dan format retry sitasi
"""
import re
import time
import unicodedata
import uuid
from typing import List, Dict, Any, Tuple, Set
from qdrant_client import models

from app.core.config import settings
from app.core.constants import (
    DOCS, STOPWORDS, LEGAL_DOMAIN_TERMS, SYSTEM_PROMPT,
    EMPATHY_TERMS, OUT_OF_SCOPE_CATEGORIES, REDIRECT_SYSTEM_PROMPT
)
from app.schemas.rag import LegalSourceDto, RagQueryResponse
from app.integrations.openrouter import embed_texts, chat_complete
from app.integrations.qdrant import query_points


def norm(s: str) -> str:
    """Normalisasi string teks bahasa Indonesia."""
    s = unicodedata.normalize("NFKC", str(s or "")).lower()
    s = re.sub(r"[^a-z0-9%]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def keywords(s: str) -> Set[str]:
    """Ekstraksi kata kunci penting tanpa stopwords."""
    return {x for x in norm(s).split() if len(x) > 2 and x not in STOPWORDS}


def topic_documents(question: str) -> List[str]:
    """Perutean topik pertanyaan ke 11 regulasi hukum spesifik."""
    q = norm(question)
    if "thr" in q or "tunjangan hari raya" in q or "lebaran" in q or "keagamaan" in q:
        return ["PERMENAKER_6_2016"]
    if "jkp" in q or "kehilangan pekerjaan" in q:
        return ["PP_6_2025", "PP_37_2021"]
    if "pkwt" in q or "pkwtt" in q or "kontrak" in q or "kompensasi" in q:
        return ["PP_35_2021", "UU_6_2023", "UU_13_2003"]
    if "phk" in q or "pemutusan hubungan kerja" in q or "pesangon" in q or "pailit" in q or "pecat" in q or "dipecat" in q or "resign" in q or "uang pisah" in q or "upmk" in q:
        return ["PP_35_2021", "UU_6_2023"]
    if "jam kerja" in q or "waktu kerja" in q or "lembur" in q or "istirahat" in q or "shift" in q or "overtime" in q:
        return ["PP_35_2021", "UU_6_2023"]
    if "upah minimum" in q or "pengupahan" in q or "ump" in q or "umk" in q or "potong upah" in q or "struktur upah" in q:
        return ["PP_49_2025", "PP_51_2023", "PP_36_2021"]
    if "ibu" in q or "melahirkan" in q or "hamil" in q or "keguguran" in q or "kia" in q:
        return ["UU_4_2024", "UU_6_2023"]
    if "putusan mk" in q or "168 puu" in q or "mahkamah konstitusi" in q:
        return ["MK_168_2023"]
    return []


def retrieve_evidence(question: str, top_k: int = 7) -> List[dict]:
    """
    Pencarian bukti pasal/ayat di Qdrant dengan filter perutean topik dan reranking leksikal.
    """
    docs = topic_documents(question)
    must = []
    if docs:
        must.append(models.FieldCondition(key="document_id", match=models.MatchAny(any=docs)))
    flt = models.Filter(must=must) if must else None

    # Vektorisasi pertanyaan
    vec = embed_texts([question])[0].tolist()

    # Ambil kandidat raw dari Qdrant
    raw = query_points(vec, max(24, top_k * 3), flt)

    qkeys = keywords(question)
    explicit_article = re.search(r"(?i)\bpasal\s+([0-9]+[a-z]?)\b", question)
    article_wanted = ("Pasal " + explicit_article.group(1).upper()) if explicit_article else None

    ranked = []
    seen = set()

    for point in raw:
        p = dict(point.payload or {})
        text = str(p.get("text") or "").strip()
        if not text or p.get("retrieval_boilerplate") is True:
            continue

        cid = str(p.get("chunk_id") or point.id)
        if cid in seen:
            continue
        seen.add(cid)

        overlap = len(qkeys & keywords(text)) / max(1, len(qkeys))
        exact_bonus = (
            0.18
            if article_wanted and str(p.get("article") or "").lower() == article_wanted.lower()
            else 0.0
        )
        section_penalty = (
            0.10
            if p.get("source_section") in {"court_text", "explanation"} and p.get("document_id") == "MK_168_2023"
            else 0.0
        )

        rerank = float(point.score) + 0.22 * overlap + exact_bonus - section_penalty
        ranked.append({
            "score": float(point.score),
            "rerank": rerank,
            "payload": p,
            "id": str(point.id)
        })

    ranked.sort(key=lambda x: x["rerank"], reverse=True)

    # Jika user menanyakan pasal spesifik namun tidak ditemukan sama sekali di kandidat
    if article_wanted and not any(
        str(x["payload"].get("article") or "").lower() == article_wanted.lower() for x in ranked
    ):
        return []

    if not ranked:
        return []

    # Plafon maksimal (safety cap)
    max_k = min(top_k or 7, 7)
    top_score = ranked[0]["rerank"]

    # Seleksi dinamis berbasis ambang batas relevansi dan penurunan tajam (drop-off)
    selected = []
    MIN_RERANK_THRESHOLD = 0.55

    for i, candidate in enumerate(ranked[:max_k]):
        score = candidate["rerank"]
        # Jika bukan 2 teratas dan skor berada di bawah threshold relevansi
        if i >= 2 and score < MIN_RERANK_THRESHOLD:
            break
        # Jika skor anjlok tajam (> 30% drop dari top score)
        if i >= 2 and score < top_score * 0.70:
            break
        # Jika gap antar kandidat berturut-turut terlalu curam (> 0.18)
        if i >= 2 and (selected[-1]["rerank"] - score > 0.18):
            break
        selected.append(candidate)

    if not selected and ranked:
        selected = ranked[:min(2, len(ranked))]

    return selected


def build_context(hits: List[dict]) -> Tuple[str, List[dict]]:
    """Membentuk blok teks konteks siap pakai untuk prompt LLM dan metadata sumber rujukan."""
    blocks, sources = [], []
    for i, hit in enumerate(hits, 1):
        p = hit["payload"]
        label = f"S{i}"
        doc_id = p.get("document_id", "UNKNOWN")
        title, url = DOCS.get(doc_id, (p.get("title", doc_id), p.get("official_url", "")))
        article = p.get("article") if p.get("article_verified") is not False else None
        section = p.get("source_section") or "unknown"
        note = (
            "PUTUSAN/PENDAPAT, bukan otomatis bunyi pasal berlaku"
            if doc_id == "MK_168_2023" and section != "court_disposition"
            else "sumber peraturan"
        )
        header = f"[{label}] {title} | {article or 'pasal belum terverifikasi'} | halaman PDF {p.get('page')} | {section} | {note}"
        text = str(p.get("text") or "")[:2600]

        blocks.append(header + "\n" + text)
        sources.append({
            "label": label,
            "document_id": doc_id,
            "title": title,
            "official_url": url,
            "article": article,
            "page": p.get("page"),
            "source_section": section,
            "text": text,
            "score": round(hit["score"], 4)
        })

    return "\n\n".join(blocks), sources


def numeric_tokens(s: str) -> Set[str]:
    """
    Ekstraksi token angka, persentase, serta nominal rupiah.
    Menghapus titik ribuan (misal Rp8.000.000 -> 8000000) dan awalan mata uang.
    """
    s = re.sub(r'(?<=\d)\.(?=\d{3}(?:\b|\D))', '', str(s or ''))
    s = s.replace(',', '.')
    s = re.sub(r'(?i)\brp\.?\s*', ' ', s)
    tokens = set()
    for m in re.findall(r'(?<![A-Za-z0-9_])\d+(?:\.\d+)?%?', s):
        tokens.add(m)
        if m.replace('.', '').isdigit():
            val = float(m)
            if val >= 1000:
                if val % 1000000 == 0:
                    tokens.add(str(int(val // 1000000)))
                if val % 1000 == 0:
                    tokens.add(str(int(val // 1000)))
    return tokens


def validate_answer(answer: str, sources: List[dict], question: str = "") -> List[str]:
    """
    Validasi groundedness sitasi dan angka pada jawaban LLM:
    - Memastikan ada sitasi rujukan [S1], [S2]
    - Memastikan label sitasi tidak fiktif
    - Memastikan angka dalam jawaban bersumber dari bukti atau input pertanyaan pengguna
    - Mengakomodasi perhitungan nominal rupiah jika pengguna menanyakan gaji/pesangon dengan angka spesifik
    """
    labels = {s["label"] for s in sources}
    # Mendukung format sitasi [S1], [S1 Pasal 5], [S1, Pasal 3 ayat 1]
    cited = set(re.findall(r"\[(S\d+)(?:[\s,:\]]|$)", answer or ""))
    problems = []

    if not (answer or "").strip():
        problems.append("empty_answer")
    if not cited:
        problems.append("missing_citation")
    if cited - labels:
        problems.append("unknown_citation:" + ",".join(sorted(cited - labels)))

    # Gabungkan teks isi, judul regulasi, dan pasal untuk ekstraksi angka sah
    source_full_text = " ".join(
        f"{s.get('title', '')} {s.get('article', '')} {s.get('text', '')}"
        for s in sources
    )
    evidence_numbers = numeric_tokens(source_full_text)
    question_numbers = numeric_tokens(question)
    allowed_numbers = evidence_numbers | question_numbers

    # Angka netral tunggal yang umum digunakan untuk penomoran poin daftar (1-9)
    harmless = {"1", "2", "3", "4", "5", "6", "7", "8", "9"}
    answer_numbers = numeric_tokens(answer)
    unsupported = answer_numbers - allowed_numbers - harmless

    # Jika pengguna menanyakan perhitungan gaji/pesangon spesifik
    is_calculation_inquiry = bool(
        re.search(r"(?i)\b(gaji|upah|juta|ribu|rp|nominal|hitung|dapat berapa|perhitungannya)\b", question)
    )
    if is_calculation_inquiry and unsupported:
        filtered_unsupported = set()
        for num in unsupported:
            if num.replace('.', '').isdigit():
                v = float(num)
                # Nominal uang besar (misal Rp8.000.000, Rp48.000.000, Rp16.000.000, Rp3.500.000)
                if v >= 1000:
                    continue
                # Desimal / pecahan hasil perhitungan proporsional (misal 6/12 = 0.5 atau 0.5 x 7 = 3.5)
                div_denominators = {12.0, 6.0, 2.0, 1.0, 100.0}
                q_vals = [float(qn) for qn in (question_numbers | evidence_numbers) if qn.replace('.', '').isdigit() and float(qn) > 0]
                is_math_match = False
                for q1 in q_vals:
                    for d in div_denominators:
                        if abs(v - (q1 / d)) < 0.05:
                            is_math_match = True
                            break
                        for q2 in q_vals:
                            if abs(v - ((q1 / d) * q2)) < 0.05 or abs(v - (q1 * q2)) < 0.05:
                                is_math_match = True
                                break
                    if is_math_match:
                        break
                if is_math_match:
                    continue
                # Hasil perkalian wajar dengan angka input di question (misal 6 x 8 = 48, 2 x 8 = 16)
                if any(v % float(qn) == 0 for qn in question_numbers if qn.replace('.', '').isdigit() and float(qn) > 1):
                    continue
                # Penjumlahan hasil perkalian (misal 48 + 16 = 64)
                if any(abs(v - float(qn)) % 8 == 0 or abs(v - float(qn)) % 6 == 0 for qn in question_numbers if qn.replace('.', '').isdigit() and float(qn) > 1):
                    continue
            filtered_unsupported.add(num)
        unsupported = filtered_unsupported

    if unsupported:
        problems.append("unsupported_numbers:" + ",".join(sorted(unsupported)))

    return problems


def check_conversational_intent(text: str) -> Tuple[bool, str]:
    """
    Mendeteksi apakah pesan pengguna merupakan salam (greeting), ucapan terima kasih,
    atau ungkapan empati & kebingungan awal (misal 'bingung', 'pusing', 'tolong')
    agar direspons secara hangat dan solutif.
    """
    q = norm(text)
    if not q:
        return False, ""

    greetings = {
        'halo', 'halo kak', 'halo min', 'halo bot', 'hai', 'hi', 'hey', 'hei', 'pagi',
        'selamat pagi', 'siang', 'selamat siang', 'sore', 'selamat sore', 'malam',
        'selamat malam', 'assalamualaikum', 'assalamu alaikum', 'permisi', 'tes', 'test',
        'halo apa kabar', 'halo selamat pagi', 'halo selamat siang', 'halo selamat sore'
    }

    gratitude = {
        'terima kasih', 'makasih', 'makasi', 'terimakasih', 'thank you', 'thanks',
        'tengkyu', 'syukron', 'matur nuwun', 'nuhun'
    }

    # Cek apakah ada pertanyaan substantif ketenagakerjaan di dalam teks yang sama
    has_substantive_legal_query = any(
        term in q for term in [
            'pkwt', 'pkwtt', 'phk', 'thr', 'pesangon', 'upah', 'gaji', 'lembur', 'cuti',
            'kontrak', 'pasal', 'permenaker', 'undang undang', 'kompensasi'
        ]
    ) and len(q.split()) > 4

    words = q.split()
    is_empathy_query = (
        q in EMPATHY_TERMS
        or any(q == term or q.startswith(term + " ") for term in EMPATHY_TERMS)
        or any(f" {term} " in f" {q} " for term in ['bingung', 'pusing', 'gimana ya', 'butuh bantuan'])
    ) and len(words) <= 7

    if not has_substantive_legal_query:
        # 1. Respon empati & orientasi untuk kebingungan
        if is_empathy_query:
            empathy_msg = (
                "Tenang, Anda berada di tempat yang tepat. Kami siap membantu Anda memahami hak-hak Anda di tempat kerja berdasarkan regulasi resmi ketenagakerjaan Indonesia.\n\n"
                "Agar saya bisa memberikan rujukan pasal hukum dan perhitungan yang presisi, coba ceritakan sedikit tentang kondisi yang Anda alami saat ini:\n"
                "• Apakah terkait masalah gaji, pemotongan upah, lembur, atau THR yang belum dibayar?\n"
                "• Apakah terkait pemutusan hubungan kerja (PHK), dipaksa resign, atau perhitungan uang pesangon & uang kompensasi?\n"
                "• Apakah terkait status perjanjian kerja (kontrak PKWT vs tetap PKWTT) atau surat peringatan (SP)?\n"
                "• Atau hak cuti (tahunan, melahirkan/hamil sesuai UU KIA No. 4/2024, sakit, dll.)?\n\n"
                "Silakan ketik atau ceritakan situasi kerja yang sedang Anda hadapi secara santai!"
            )
            return True, empathy_msg

        # 2. Respon salam ramah
        if q in greetings or any(q.startswith(g + " ") for g in ['halo', 'hai', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum']):
            greeting_msg = (
                "Halo! Saya asisten kepatuhan hukum ketenagakerjaan Indonesia berbasis bukti regulasi resmi.\n\n"
                "Saya dapat membantu Anda memahami hak dan kewajiban kerja berdasarkan UU Ketenagakerjaan/Cipta Kerja, Peraturan Pemerintah, Permenaker, dan Putusan Mahkamah Konstitusi, seperti:\n"
                "• Perhitungan hak THR Keagamaan proporsional maupun penuh\n"
                "• Uang Pesangon, Penghargaan Masa Kerja (UPMK), & Uang Pisah saat PHK atau Resign\n"
                "• Status kontrak kerja PKWT vs PKWTT serta uang kompensasi berakhirnya kontrak\n"
                "• Aturan upah minimum (UMP/UMK), lembur, waktu kerja, dan istirahat mingguan\n"
                "• Hak cuti (tahunan, melahirkan/hamil sesuai UU KIA No. 4/2024, sakit, dll.)\n"
                "• Jaminan Kehilangan Pekerjaan (JKP) dan Putusan MK No. 168/PUU-XXI/2023\n\n"
                "Ada hal seputar hak kerja Anda yang ingin Anda tanyakan?"
            )
            return True, greeting_msg

        # 3. Respon terima kasih
        if q in gratitude or any(q.startswith(t + " ") for t in gratitude):
            gratitude_msg = (
                "Sama-sama! Senang bisa membantu Anda memahami regulasi hak ketenagakerjaan secara jelas dan berbasis bukti resmi. "
                "Jika ada hal lain yang ingin Anda pastikan atau hitung kembali, silakan tanyakan kapan saja. Tetap semangat!"
            )
            return True, gratitude_msg

    return False, ""


def check_out_of_scope_redirection(text: str) -> Tuple[bool, str]:
    """
    Memeriksa apakah pertanyaan berada di kategori blacklist (di luar domain ketenagakerjaan)
    dan menghasilkan pesan pengalihan santun dengan tautan resmi layanan pemerintah RI terkait.
    """
    q = norm(text)
    padded = f" {q} "
    for cat in OUT_OF_SCOPE_CATEGORIES:
        for kw in cat["keywords"]:
            if f" {kw} " in padded or q == kw or q.startswith(kw + " ") or q.endswith(" " + kw):
                msg = (
                    f"Pertanyaan Anda mengenai **{cat['label']}** berada di luar ruang lingkup regulasi ketenagakerjaan.\n\n"
                    f"Untuk informasi atau pengurusan resmi terkait hal tersebut, silakan akses layanan resmi berikut:\n"
                    f"• [{cat['official_name']}]({cat['official_url']})\n\n"
                    f"💡 *Panduan Layanan:* {cat['guidance']}\n\n"
                    f"Hak Ketenagakerjaan AI khusus membantu menjawab pertanyaan seputar hak pekerja, perjanjian kerja (PKWT/PKWTT), upah, pesangon PHK, kompensasi kontrak, THR, dan cuti. Silakan ajukan pertanyaan terkait ketenagakerjaan jika ada yang ingin Anda tanyakan!"
                )
                return True, msg
    return False, ""


def reindex_citations_for_layman(
    answer: str,
    sources: List[dict]
) -> Tuple[str, List[dict]]:
    """
    Mengubah label sitasi teknis internal [S1], [S3] menjadi label yang ramah user awam:
    [Rujukan 1], [Rujukan 2], dst. secara berurutan sesuai urutan pemunculan di dalam teks,
    serta menyelaraskan daftar sumber referensi aktif agar urutan dan penomorannya 100% konsisten.
    """
    if not (answer or "").strip():
        return answer, sources

    raw_citations = re.findall(r"\[(S\d+)(?:[\s,:\]]|$)", answer)
    if not raw_citations:
        return answer, sources

    seen_labels = []
    for lab in raw_citations:
        if lab not in seen_labels:
            seen_labels.append(lab)

    if not seen_labels:
        return answer, sources

    label_map = {old: f"Rujukan {i + 1}" for i, old in enumerate(seen_labels)}

    new_answer = answer
    for old, new in label_map.items():
        new_answer = re.sub(rf"\[{old}(?=[\s,:\]])", f"[{new}", new_answer)

    source_by_label = {s.get("label"): s for s in sources}
    reordered_sources = []
    for old in seen_labels:
        if old in source_by_label:
            s_copy = dict(source_by_label[old])
            s_copy["label"] = label_map[old]
            reordered_sources.append(s_copy)

    return new_answer, reordered_sources


def _execute_single_ask(
    question: str,
    top_k: int,
    request_id: str,
    started_at: float,
    history: List[dict] = None,
    retrieval_query: str = None
) -> RagQueryResponse:
    """Eksekusi satu putaran retrieval -> context -> chat -> validation."""
    if not isinstance(question, str) or len(question.strip()) < 2:
        return RagQueryResponse(
            status="invalid_question",
            answer="Pertanyaan terlalu pendek untuk diproses.",
            sources=[],
            request_id=request_id,
            latency_seconds=round(time.time() - started_at, 2)
        )

    # 1. Retrieval menggunakan query yang diperluas konteks percakapan jika ada
    search_query = (retrieval_query or question).strip()
    hits = retrieve_evidence(search_query, top_k)
    if not hits or hits[0]["score"] < 0.40:
        # Jika retrieval tidak menemukan bukti yang cukup di korpus ketenagakerjaan,
        # gunakan LLM dengan REDIRECT_SYSTEM_PROMPT untuk memberikan arahan layanan/portal resmi yang tepat
        try:
            redirect_reply, _ = chat_complete([
                {"role": "system", "content": REDIRECT_SYSTEM_PROMPT},
                {"role": "user", "content": question}
            ])
            return RagQueryResponse(
                status="out_of_scope",
                answer=redirect_reply,
                sources=[],
                request_id=request_id,
                latency_seconds=round(time.time() - started_at, 2)
            )
        except Exception:
            return RagQueryResponse(
                status="out_of_scope",
                answer="Pertanyaan ini berada di luar ruang lingkup regulasi hukum ketenagakerjaan yang tersedia. Silakan hubungi layanan resmi instansi pemerintah terkait sesuai bidang pertanyaan Anda.",
                sources=[],
                request_id=request_id,
                latency_seconds=round(time.time() - started_at, 2)
            )

    # 2. Build Context
    context, sources = build_context(hits)
    user_prompt = f"PERTANYAAN:\n{question}\n\nBUKTI:\n{context}"

    # 3. Chat Complete dengan riwayat percakapan
    llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history and isinstance(history, list):
        for h in history[-4:]:
            r = h.get("role")
            c = str(h.get("content") or "").strip()
            if r in {"user", "assistant"} and c and not c.startswith("Maaf, terjadi gangguan"):
                llm_messages.append({"role": r, "content": c[:1200]})
    llm_messages.append({"role": "user", "content": user_prompt})

    try:
        answer, diagnostics = chat_complete(llm_messages)
    except Exception as exc:
        return RagQueryResponse(
            status="service_unavailable",
            answer="Layanan model sementara tidak menghasilkan respons yang dapat diproses. Silakan coba lagi.",
            sources=[LegalSourceDto(**{k: v for k, v in s.items() if k != "text"}) for s in sources],
            request_id=request_id,
            latency_seconds=round(time.time() - started_at, 2),
            diagnostics={"error": str(exc)[:300]}
        )

    # 4. Validate Groundedness
    problems = validate_answer(answer, sources, question=f"{search_query} {question}")

    # Jika masalahnya adalah missing_citation dan pertanyaan tidak berkaitan dengan ranah ketenagakerjaan
    if "missing_citation" in problems:
        q_norm = norm(question)
        has_legal_terms = any(term in q_norm for term in LEGAL_DOMAIN_TERMS) or bool(topic_documents(question))
        if not has_legal_terms:
            try:
                redirect_reply, _ = chat_complete([
                    {"role": "system", "content": REDIRECT_SYSTEM_PROMPT},
                    {"role": "user", "content": question}
                ])
                return RagQueryResponse(
                    status="out_of_scope",
                    answer=redirect_reply,
                    sources=[],
                    request_id=request_id,
                    latency_seconds=round(time.time() - started_at, 2)
                )
            except Exception:
                pass

    status = "answered" if not problems else "needs_review"
    if problems:
        answer = "Jawaban model ditahan karena belum lolos validasi bukti: " + "; ".join(problems) + "."

    # 5. Re-indexing Sitasi ke Format Awam [Rujukan 1], [Rujukan 2] & Format DTO
    if status == "answered":
        final_answer, active_sources = reindex_citations_for_layman(answer, sources)
    else:
        final_answer = answer
        active_sources = sources

    public_sources = [
        LegalSourceDto(**{k: v for k, v in s.items() if k != "text"})
        for s in active_sources
    ]

    return RagQueryResponse(
        status=status,
        answer=final_answer,
        sources=public_sources,
        request_id=request_id,
        latency_seconds=round(time.time() - started_at, 2),
        diagnostics={
            "problems": problems,
            "internal_diagnostics": diagnostics
        }
    )


def ask_rag(
    question: str,
    top_k: int = None,
    request_id: str = None,
    history: List[dict] = None
) -> RagQueryResponse:
    """
    Fungsi orkestrasi utama RAG:
    - Melakukan deteksi salam/terima kasih agar interaktif dan ramah
    - Mengintegrasikan konteks riwayat percakapan sebelumnya untuk pertanyaan lanjutan
    - Melakukan pemeriksaan domain guard yang adaptif
    - Menjalankan eksekusi retrieval & generasi
    - Melakukan 1x format retry jika kesalahan hanya berupa sitasi
    """
    started_at = time.time()
    req_id = request_id or str(uuid.uuid4())
    effective_top_k = top_k or settings.top_k

    # 1. Cek maksud percakapan ramah (salam / terima kasih / empati bingung)
    is_conversational, conversational_reply = check_conversational_intent(question)
    if is_conversational and conversational_reply:
        return RagQueryResponse(
            status="answered",
            answer=conversational_reply,
            sources=[],
            request_id=req_id,
            latency_seconds=round(time.time() - started_at, 2)
        )

    # 2. Cek apakah pertanyaan masuk daftar Blacklist di luar topik (Pajak, Pidana, Agraria, dll.)
    is_out_of_scope, redirect_msg = check_out_of_scope_redirection(question)
    if is_out_of_scope and redirect_msg:
        return RagQueryResponse(
            status="out_of_scope",
            answer=redirect_msg,
            sources=[],
            request_id=req_id,
            latency_seconds=round(time.time() - started_at, 2)
        )

    # 3. Rekonstruksi pertanyaan lanjutan dari riwayat percakapan
    prior_user_question = ""
    if history and isinstance(history, list):
        for h in reversed(history):
            if h.get("role") == "user" and str(h.get("content") or "").strip():
                prior_user_question = str(h.get("content")).strip()
                break

    q_norm = norm(question)
    words = q_norm.split()
    is_follow_up_hint = (
        len(words) <= 7 or
        any(w in q_norm for w in [
            'kalo', 'kalau', 'jika', 'terus', 'lalu', 'bagaimana', 'berapa', 'gajinya',
            'gaji', 'juta', 'ribu', 'nominal', 'hitung', 'rumus', 'dan', 'apakah berhak'
        ])
    )

    if prior_user_question and is_follow_up_hint:
        retrieval_query = f"{prior_user_question} {question}"
    else:
        retrieval_query = question

    # 4. Putaran pertama RAG pipeline (semua pertanyaan non-blacklist dieksekusi)
    result = _execute_single_ask(
        question=question,
        top_k=effective_top_k,
        request_id=req_id,
        started_at=started_at,
        history=history,
        retrieval_query=retrieval_query
    )

    # 5. Format retry jika hanya masalah format sitasi (misal lupa tanda sitasi)
    problems = (result.diagnostics or {}).get("problems", [])
    citation_only = (
        result.status == "needs_review"
        and problems
        and all(p == "missing_citation" or p.startswith("unknown_citation:") for p in problems)
    )

    if citation_only:
        retry_result = _execute_single_ask(
            question=question,
            top_k=effective_top_k,
            request_id=req_id,
            started_at=started_at,
            history=history,
            retrieval_query=retrieval_query
        )
        if retry_result.diagnostics:
            retry_result.diagnostics["format_retry_used"] = True
        return retry_result

    return result

