"""
Pengujian Benchmark Baseline RAG (Diadaptasi dari Cell 14 Clean Notebook).
"""
import sys
from pathlib import Path

# Tambahkan root services/rag ke sys.path
RAG_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAG_ROOT))

from app.rag.engine import (
    ask_rag, norm, keywords, topic_documents, numeric_tokens,
    validate_answer, reindex_citations_for_layman, check_conversational_intent
)


def test_preprocessing():
    assert norm("Apakah  PKWT 2021?") == "apakah pkwt 2021"
    kw = keywords("Berapa upah minimum pekerja di tahun 2025?")
    assert "upah" in kw and "minimum" in kw
    assert topic_documents("Bagaimana aturan THR?") == ["PERMENAKER_6_2016"]
    assert topic_documents("Aturan tentang JKP") == ["PP_6_2025", "PP_37_2021"]


def test_conversational_greeting_and_gratitude():
    """Uji deteksi sapaan ramah dan ucapan terima kasih tanpa terblokir guardrail."""
    is_conv, reply = check_conversational_intent("halo")
    assert is_conv is True
    assert "asisten kepatuhan hukum ketenagakerjaan" in reply

    is_conv2, reply2 = check_conversational_intent("terima kasih banyak")
    assert is_conv2 is True
    assert "Sama-sama" in reply2

    # Melalui ask_rag langsung
    res_halo = ask_rag("halo")
    assert res_halo.status == "answered"
    assert "asisten kepatuhan" in res_halo.answer
    assert res_halo.latency_seconds < 0.5


def test_reindex_citations_for_layman():
    """Uji re-indexing dari sitasi acak [S3], [S2] ke bahasa awam berurutan [Rujukan 1], [Rujukan 2]."""
    raw_answer = "Ketentuan THR wajib diberikan [S3]. Pekerja berhak proporsional [S2]."
    mock_sources = [
        {"label": "S1", "title": "UU Cipta Kerja", "article": "Pasal 1"},
        {"label": "S2", "title": "Permenaker THR", "article": "Pasal 3"},
        {"label": "S3", "title": "Permenaker THR", "article": "Pasal 2"},
    ]

    new_ans, reindexed_sources = reindex_citations_for_layman(raw_answer, mock_sources)

    # Memastikan teks berubah menjadi [Rujukan 1] dan [Rujukan 2]
    assert "[Rujukan 1]" in new_ans
    assert "[Rujukan 2]" in new_ans
    assert "[S3]" not in new_ans
    assert "[S2]" not in new_ans

    # Memastikan urutan sumber sesuai kemunculan: S3 pertama (Rujukan 1), S2 kedua (Rujukan 2)
    assert len(reindexed_sources) == 2
    assert reindexed_sources[0]["label"] == "Rujukan 1"
    assert reindexed_sources[0]["article"] == "Pasal 2"
    assert reindexed_sources[1]["label"] == "Rujukan 2"
    assert reindexed_sources[1]["article"] == "Pasal 3"


def test_validator():
    mock_sources = [
        {"label": "S1", "text": "Pasal 15 ayat 1 upah dibayar tanggal 25."},
        {"label": "S2", "text": "Kompensasi diberikan 1 bulan upah."}
    ]
    # Jawaban valid
    valid_ans = "Upah dibayar tanggal 25 [S1] dan kompensasi 1 bulan upah [S2]."
    assert validate_answer(valid_ans, mock_sources) == []

    # Jawaban tanpa sitasi
    missing_ans = "Upah dibayar tanggal 25."
    assert "missing_citation" in validate_answer(missing_ans, mock_sources)

    # Jawaban angka fiktif
    fake_num_ans = "Upah dibayar tanggal 30 [S1]."
    assert any("unsupported_numbers" in p for p in validate_answer(fake_num_ans, mock_sources))


def test_empathy_and_confusion():
    """Uji kata 'Bingung', 'Pusing', dsb agar tidak diblokir dan dijawab dengan panduan empati."""
    res_bingung = ask_rag("Bingung")
    assert res_bingung.status == "answered"
    assert "Tenang" in res_bingung.answer
    assert "gaji" in res_bingung.answer
    assert res_bingung.latency_seconds < 0.5

    res_pusing = ask_rag("Saya pusing banget nih min")
    assert res_pusing.status == "answered"
    assert "Tenang" in res_pusing.answer


def test_live_multi_turn_thr_and_salary():
    """Uji skenario persis user: pertanyaan lanjutan gaji setelah THR dengan riwayat percakapan."""
    history = [
        {
            "role": "user",
            "content": "Saya baru kerja 6 bulan apakah mendapatkan THR?"
        },
        {
            "role": "assistant",
            "content": "Berdasarkan Permenaker Nomor 6 Tahun 2016 tentang THR Keagamaan, Anda berhak mendapatkan THR secara proporsional [Rujukan 1]."
        }
    ]
    q2 = "Kalo saya gajinya 7 juta"
    res = ask_rag(q2, history=history)
    print(f"\n[MULTI-TURN RESULT] Status: {res.status}")
    print(f"Jawaban: {res.answer}")
    print(f"Sumber: {[s.label for s in res.sources]}")

    assert res.status in {"answered", "needs_review"}
    assert len(res.sources) > 0
    # Memastikan tidak ada label teknis mentah [S1]/[S2]/[S3] di teks jawaban
    assert "[S1]" not in res.answer and "[S2]" not in res.answer and "[S3]" not in res.answer
    # Jika answered, memastikan sitasi berurutan rapi Rujukan 1, dst.
    if res.status == "answered" and res.sources:
        assert res.sources[0].label == "Rujukan 1"


def test_live_benchmark_single():
    """Uji live 1 pertanyaan inti: perbedaan PKWT dan PKWTT"""
    q = "Apa perbedaan PKWT dan PKWTT menurut peraturan ketenagakerjaan?"
    res = ask_rag(q)
    print(f"\n[TEST RESULT] Status: {res.status}")
    print(f"Jawaban: {res.answer[:150]}...")
    print(f"Jumlah Sumber: {len(res.sources)}")
    assert res.status in {"answered", "needs_review"}
    assert len(res.sources) > 0


def test_live_out_of_domain():
    """Uji pertanyaan di luar domain (pajak kendaraan di Bali) -> dialihkan ke Samsat / link resmi"""
    q = "Berapa tarif pajak kendaraan bermotor di Provinsi Bali?"
    res = ask_rag(q)
    print(f"\n[OUT-OF-DOMAIN RESULT] Status: {res.status}")
    print(f"Jawaban: {res.answer}")
    assert res.status in {"out_of_scope", "insufficient_evidence"}
    assert len(res.sources) == 0
    # Memastikan diarahkan ke layanan resmi Samsat/SIGNAL
    assert "samsat" in res.answer.lower() or "signal" in res.answer.lower() or ".id" in res.answer


def test_live_fake_article():
    """Uji pasal fiktif (Pasal 999 PP 35/2021) -> out_of_scope atau insufficient_evidence"""
    q = "Apa isi Pasal 999 PP Nomor 35 Tahun 2021?"
    res = ask_rag(q)
    print(f"\n[FAKE ARTICLE RESULT] Status: {res.status}")
    print(f"Jawaban: {res.answer}")
    assert res.status in {"insufficient_evidence", "out_of_scope"}

