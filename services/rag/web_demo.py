"""
Web Demo Interaktif Sederhana (Streamlit) untuk Menguji HakPekerja.AI RAG.
Jalankan dengan: streamlit run web_demo.py
"""
import sys
import time
from pathlib import Path
import streamlit as st

RAG_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(RAG_ROOT))

from app.rag.engine import ask_rag

st.set_page_config(
    page_title="HakPekerja.AI - RAG Tester",
    page_icon="⚖️",
    layout="centered"
)

st.title("⚖️ HakPekerja.AI - RAG Tester")
st.caption("Chatbot Berbasis Regulasi Ketenagakerjaan Indonesia | DeepSeek Flash v4 & Qdrant")

# Sidebar info
with st.sidebar:
    st.header("ℹ️ Pengaturan RAG")
    st.markdown("""
    - **Engine:** Python FastAPI RAG
    - **Vector DB:** Qdrant Cloud (6.394 points)
    - **Embedding:** `baai/bge-m3` (1024 dim)
    - **Chat Model:** `deepseek-v4.1-flash` (Bariska Cloud)
    - **Korpus:** 11 Regulasi Ketenagakerjaan
    """)
    st.divider()
    st.markdown("### Contoh Pertanyaan Cepat:")
    examples = [
        "Apa perbedaan PKWT dan PKWTT?",
        "Berapa jam kerja normal dalam seminggu?",
        "Kerja 6 bulan dapat THR berapa?",
        "Hak kompensasi pekerja kontrak?",
        "Berapa lama cuti melahirkan UU KIA?",
        "Pajak motor di Bali (Uji Luar Domain)"
    ]
    for ex in examples:
        if st.button(ex, use_container_width=True):
            st.session_state["user_query"] = ex

# Inisialisasi riwayat pesan chat
if "messages" not in st.session_state:
    st.session_state.messages = []

# Tampilkan pesan riwayat
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("sources"):
            with st.expander(f"📚 {len(msg['sources'])} Rujukan Hukum Resmi"):
                for s in msg["sources"]:
                    pasal = f" | {s.article}" if s.article else ""
                    st.markdown(f"- **[{s.label}]** {s.title}{pasal}")
                    if s.official_url:
                        st.markdown(f"  🔗 [Tautan Resmi JDIH/BPK]({s.official_url})")

# Input pengguna
prompt = st.chat_input("Tanyakan hak ketenagakerjaan Anda...")
if "user_query" in st.session_state and st.session_state["user_query"]:
    prompt = st.session_state.pop("user_query")

if prompt:
    # Simpan pesan user
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Jalankan RAG
    with st.chat_message("assistant"):
        with st.spinner("Mencari bukti hukum di Qdrant dan menalar dengan DeepSeek..."):
            res = ask_rag(prompt)
            st.markdown(res.answer)

            # Badge status
            if res.status == "answered":
                st.success(f"Status: **{res.status}** ({res.latency_seconds}s)")
            else:
                st.warning(f"Status: **{res.status}** ({res.latency_seconds}s)")

            # Tampilkan rujukan hukum
            if res.sources:
                with st.expander(f"📚 {len(res.sources)} Rujukan Hukum Resmi"):
                    for s in res.sources:
                        pasal = f" | {s.article}" if s.article else ""
                        st.markdown(f"- **[{s.label}]** {s.title}{pasal}")
                        if s.official_url:
                            st.markdown(f"  🔗 [Tautan Resmi JDIH/BPK]({s.official_url})")

            # Simpan ke session
            st.session_state.messages.append({
                "role": "assistant",
                "content": res.answer,
                "sources": res.sources,
                "status": res.status
            })

