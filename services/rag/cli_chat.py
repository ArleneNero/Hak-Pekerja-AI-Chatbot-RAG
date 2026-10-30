"""
CLI Interaktif untuk Menguji Chatbot HakPekerja.AI RAG secara Langsung.
Jalankan dengan: python cli_chat.py
"""
import sys
import time
from pathlib import Path

# Setup import path
RAG_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(RAG_ROOT))

from app.rag.engine import ask_rag

PRESET_QUESTIONS = [
    "Apa perbedaan PKWT dan PKWTT menurut peraturan ketenagakerjaan?",
    "Berapa jam kerja normal karyawan dalam satu minggu dan bagaimana ketentuan lembur?",
    "Karyawan yang baru bekerja 6 bulan apakah berhak mendapatkan THR? Berapa perhitungannya?",
    "Apa saja hak pekerja atau pesangon jika terkena PHK karena efisiensi?",
    "Apakah pekerja kontrak (PKWT) yang masa kerjanya selesai berhak atas uang kompensasi?",
    "Berapa lama hak cuti melahirkan bagi ibu bekerja menurut UU Nomor 4 Tahun 2024?",
    "Berapa tarif pajak kendaraan bermotor di Provinsi Bali? (Kasus di luar hukum ketenagakerjaan)",
    "Apa isi Pasal 999 PP Nomor 35 Tahun 2021? (Kasus pasal fiktif)"
]


def print_banner():
    print("\n" + "=" * 70)
    print("      HAKPEKERJA.AI - INTERACTIVE RAG CLI TESTER")
    print("      Model: DeepSeek Flash v4 (Chat) | BGE-M3 (Qdrant)")
    print("=" * 70)
    print("Perintah: Ketik nomor (1-8) untuk pertanyaan contoh,")
    print("          Ketik pertanyaan Anda sendiri secara bebas,")
    print("          atau ketik 'keluar' / 'exit' untuk selesai.\n")


def print_presets():
    print("Pilihan Pertanyaan Contoh Kasus:")
    for i, q in enumerate(PRESET_QUESTIONS, 1):
        print(f"  [{i}] {q}")
    print()


def ask_and_display(question: str):
    print("\n" + "-" * 70)
    print(f"PERTANYAAN: {question}")
    print("Sedang mencari regulasi di Qdrant & menalar dengan DeepSeek...")
    t0 = time.time()
    res = ask_rag(question)
    duration = time.time() - t0

    print("-" * 70)
    print(f"STATUS HASIL : {res.status.upper()} (Latency: {res.latency_seconds}s | Total: {round(duration, 2)}s)")
    print("-" * 70)
    print("JAWABAN:")
    print(res.answer)
    print("\n" + "-" * 70)

    if res.sources:
        print(f"RUJUKAN HUKUM RESMI ({len(res.sources)} sumber):")
        for s in res.sources:
            label = s.label or "S"
            pasal = f" | {s.article}" if s.article else ""
            hal = f" (Hal. PDF {s.page})" if s.page else ""
            print(f"  [{label}] {s.title}{pasal}{hal}")
            if s.official_url:
                print(f"      Link Resmi: {s.official_url}")
    else:
        print("RUJUKAN HUKUM: Tidak ada sumber yang dilampirkan (sesuai status).")
    print("=" * 70 + "\n")


def main():
    print_banner()
    print_presets()

    while True:
        try:
            user_input = input("Tanya HakPekerja.AI > ").strip()
            if not user_input:
                continue

            if user_input.lower() in {"exit", "keluar", "q"}:
                print("Terima kasih! Sesi pengujian selesai.")
                break

            # Cek jika memilih angka 1-8
            if user_input.isdigit():
                idx = int(user_input) - 1
                if 0 <= idx < len(PRESET_QUESTIONS):
                    question = PRESET_QUESTIONS[idx]
                else:
                    print(f"Pilihan nomor tidak valid (pilih 1-{len(PRESET_QUESTIONS)}).")
                    continue
            else:
                question = user_input

            ask_and_display(question)

        except KeyboardInterrupt:
            print("\nSesi dihentikan.")
            break
        except Exception as e:
            print(f"\n[ERROR] Terjadi kendala: {e}\n")


if __name__ == "__main__":
    main()

