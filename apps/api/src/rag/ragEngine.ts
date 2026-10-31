import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env';
import {
  DOCS,
  STOPWORDS,
  LEGAL_DOMAIN_TERMS,
  EMPATHY_TERMS,
  OUT_OF_SCOPE_CATEGORIES,
  SYSTEM_PROMPT,
  REDIRECT_SYSTEM_PROMPT,
} from './constants';

export interface LegalSourceDto {
  id: string;
  title: string;
  label?: string;
  article?: string;
  page?: number;
  official_url?: string;
  source_section?: string;
}

export type RagStatus =
  | 'answered'
  | 'insufficient_evidence'
  | 'needs_review'
  | 'out_of_scope'
  | 'invalid_question'
  | 'service_unavailable';

export interface RagResult {
  status: RagStatus;
  answer: string;
  sources: LegalSourceDto[];
  request_id: string;
  latency_seconds: number;
}

// Inisialisasi Qdrant Client
const qdrant = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey,
  checkCompatibility: false,
});

/**
 * Ubah nama section teknis database menjadi bahasa yang mudah dipahami masyarakat awam.
 */
export function humanizeSection(section?: string): string {
  if (!section) return 'Batang Tubuh Peraturan';
  const s = section.toLowerCase().trim();
  switch (s) {
    case 'regulation_body':
      return 'Batang Tubuh Peraturan';
    case 'explanation':
      return 'Penjelasan Resmi Regulasi';
    case 'court_text':
      return 'Pertimbangan Putusan Hakim';
    case 'general_provision':
      return 'Ketentuan Umum';
    case 'closing_provision':
      return 'Ketentuan Penutup';
    case 'transitional_provision':
      return 'Ketentuan Peralihan';
    case 'annex':
      return 'Lampiran Peraturan';
    default:
      return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Normalisasi teks Indonesia
 */
function norm(s: string): string {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ekstraksi kata kunci tanpa stopwords
 */
function keywords(s: string): Set<string> {
  const words = norm(s).split(' ');
  const res = new Set<string>();
  for (const w of words) {
    if (w.length > 2 && !STOPWORDS.has(w)) {
      res.add(w);
    }
  }
  return res;
}

/**
 * Perutean topik pertanyaan ke 11 regulasi spesifik
 */
function topicDocuments(question: string): string[] {
  const q = norm(question);
  if (q.includes('thr') || q.includes('tunjangan hari raya') || q.includes('lebaran') || q.includes('keagamaan')) {
    return ['PERMENAKER_6_2016'];
  }
  if (q.includes('jkp') || q.includes('kehilangan pekerjaan')) {
    return ['PP_6_2025', 'PP_37_2021'];
  }
  if (q.includes('pkwt') || q.includes('pkwtt') || q.includes('kontrak') || q.includes('kompensasi')) {
    return ['PP_35_2021', 'UU_6_2023', 'UU_13_2003'];
  }
  if (
    q.includes('phk') ||
    q.includes('pemutusan hubungan kerja') ||
    q.includes('pesangon') ||
    q.includes('pailit') ||
    q.includes('pecat') ||
    q.includes('dipecat') ||
    q.includes('resign') ||
    q.includes('uang pisah') ||
    q.includes('upmk')
  ) {
    return ['PP_35_2021', 'UU_6_2023'];
  }
  if (
    q.includes('jam kerja') ||
    q.includes('waktu kerja') ||
    q.includes('lembur') ||
    q.includes('istirahat') ||
    q.includes('shift') ||
    q.includes('overtime')
  ) {
    return ['PP_35_2021', 'UU_6_2023'];
  }
  if (
    q.includes('upah minimum') ||
    q.includes('pengupahan') ||
    q.includes('ump') ||
    q.includes('umk') ||
    q.includes('potong upah') ||
    q.includes('struktur upah')
  ) {
    return ['PP_49_2025', 'PP_51_2023', 'PP_36_2021'];
  }
  if (
    q.includes('ibu') ||
    q.includes('melahirkan') ||
    q.includes('hamil') ||
    q.includes('keguguran') ||
    q.includes('kia')
  ) {
    return ['UU_4_2024', 'UU_6_2023'];
  }
  if (q.includes('putusan mk') || q.includes('168 puu') || q.includes('mahkamah konstitusi')) {
    return ['MK_168_2023'];
  }
  return [];
}

/**
 * Menghasilkan Vektor Embedding lewat OpenRouter (BAAI BGE-M3 1024-dim)
 */
async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${config.embeddingBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.embeddingApiKey}`,
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API failed (${res.status}): ${errText.slice(0, 100)}`);
  }

  const data = (await res.json()) as any;
  return data.data[0].embedding;
}

/**
 * Panggil LLM Chat Completion (Bariska Cloud / OpenRouter Fallback)
 */
async function callChatCompletion(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.2
): Promise<string> {
  // Coba Provider Utama (Bariska Cloud)
  try {
    const res = await fetch(`${config.chatBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.chatApiKey}`,
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages,
        temperature,
        max_tokens: 2500,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (content) return content.trim();
    }
  } catch (e) {
    console.warn('[RAG Engine] Primary LLM failed, using fallback:', e);
  }

  // Fallback ke OpenRouter (DeepSeek Chat resmi)
  const openRouterApiKey = config.chatFallbackApiKey || config.embeddingApiKey;
  if (openRouterApiKey) {
    try {
      const fallbackRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages,
          temperature,
          max_tokens: 2500,
        }),
      });

      if (fallbackRes.ok) {
        const data = (await fallbackRes.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } else {
        console.warn('[RAG Engine] Fallback OpenRouter responded with:', fallbackRes.status);
      }
    } catch (fallbackErr) {
      console.warn('[RAG Engine] Fallback OpenRouter call failed:', fallbackErr);
    }
  }

  throw new Error('Semua provider LLM gagal merespons.');
}

/**
 * Mesin Inti RAG HakPekerja.AI
 */
export async function executeRagQuery(
  question: string,
  topK: number = 7,
  requestId: string = '',
  history: Array<{ role: string; content: string }> = []
): Promise<RagResult> {
  const startTime = Date.now();
  const reqId = requestId || `req-${Date.now()}`;
  const qClean = (question || '').trim();
  const qNorm = norm(qClean);

  if (!qClean) {
    return {
      status: 'invalid_question',
      answer: 'Mohon ajukan pertanyaan yang lebih spesifik seputar hak ketenagakerjaan.',
      sources: [],
      request_id: reqId,
      latency_seconds: (Date.now() - startTime) / 1000,
    };
  }

  // 1. Cek Salam / Sapaan Ramah
  const greetings = ['halo', 'hai', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum'];
  if (greetings.includes(qNorm) || qNorm === 'terima kasih' || qNorm === 'makasih') {
    return {
      status: 'answered',
      answer: 'Halo! Saya asisten Hak Ketenagakerjaan AI. Ada yang bisa saya bantu terkait hak kerja, gaji, lembur, pesangon, atau kontrak kerja Anda hari ini?',
      sources: [],
      request_id: reqId,
      latency_seconds: (Date.now() - startTime) / 1000,
    };
  }

  // 2. Cek Pertanyaan di Luar Lingkup (Out-of-Scope)
  for (const cat of OUT_OF_SCOPE_CATEGORIES) {
    if (cat.keywords.some((kw) => qNorm.includes(kw))) {
      return {
        status: 'out_of_scope',
        answer: `Pertanyaan Anda mengenai **${cat.label}** berada di luar cakupan regulasi ketenagakerjaan. ${cat.guidance}\n\nLayanan resmi: [${cat.official_name}](${cat.official_url})`,
        sources: [
          {
            id: cat.category,
            title: cat.official_name,
            official_url: cat.official_url,
          },
        ],
        request_id: reqId,
        latency_seconds: (Date.now() - startTime) / 1000,
      };
    }
  }

  // 3. Retrieval Vektor ke Qdrant Cloud
  const queryVector = await embedText(qClean);
  const targetDocs = topicDocuments(qClean);

  let filter: any = undefined;
  if (targetDocs.length > 0) {
    filter = {
      must: [
        {
          key: 'document_id',
          match: {
            any: targetDocs,
          },
        },
      ],
    };
  }

  // Ambil kandidat poin dari Qdrant (gunakan query API terbaru / fallback)
  const searchLimit = Math.max(24, (topK || 7) * 3);
  let qdrantPoints: any[] = [];
  try {
    const response = await (qdrant as any).query(config.qdrantCollection, {
      query: queryVector,
      limit: searchLimit,
      filter,
      with_payload: true,
    });
    // Response dari client.query bisa berupa array langsung atau object points
    qdrantPoints = Array.isArray(response) ? response : (response?.points || []);
  } catch (err) {
    console.error('[Qdrant Search Error]', err);
    throw new Error('Gagal melakukan pencarian pada database vektor regulasi hukum.');
  }

  // 4. Reranking Leksikal & Seleksi Bukti Relevan
  const qKeys = keywords(qClean);
  const explicitArticleMatch = qClean.match(/pasal\s+([0-9]+[a-z]?)/i);
  const articleWanted = explicitArticleMatch ? `Pasal ${explicitArticleMatch[1].toUpperCase()}` : null;

  const ranked: Array<{ score: number; rerank: number; payload: any; id: string }> = [];
  const seen = new Set<string>();

  for (const point of qdrantPoints) {
    const p = point.payload || {};
    const text = String(p.text || '').trim();
    if (!text || p.retrieval_boilerplate === true) continue;

    const cid = String(p.chunk_id || point.id);
    if (seen.has(cid)) continue;
    seen.add(cid);

    const textKeys = keywords(text);
    let overlapCount = 0;
    for (const k of qKeys) {
      if (textKeys.has(k)) overlapCount++;
    }
    const overlap = overlapCount / Math.max(1, qKeys.size);

    const exactBonus =
      articleWanted && String(p.article || '').toLowerCase() === articleWanted.toLowerCase() ? 0.18 : 0.0;

    const sectionPenalty =
      p.source_section && ['court_text', 'explanation'].includes(p.source_section) && p.document_id === 'MK_168_2023'
        ? 0.1
        : 0.0;

    const rerank = Number(point.score || 0) + 0.22 * overlap + exactBonus - sectionPenalty;
    ranked.push({
      score: Number(point.score || 0),
      rerank,
      payload: p,
      id: String(point.id),
    });
  }

  ranked.sort((a, b) => b.rerank - a.rerank);

  if (ranked.length === 0) {
    return {
      status: 'insufficient_evidence',
      answer: 'Maaf, rujukan pasal atau dokumen regulasi terkait belum ditemukan dalam basis data hukum kami.',
      sources: [],
      request_id: reqId,
      latency_seconds: (Date.now() - startTime) / 1000,
    };
  }

  // Seleksi sumber secara dinamis se-relevan mungkin (bukan dipatok mati 7 sumber):
  // Ambil top-1 sebagai anchor. Chunks berikutnya hanya diambil jika:
  // - Skor rerank >= 75% dari topScore ATAU selisih rerank <= 0.15
  // - DAN skor absolut rerank >= 0.40
  // Fleksibel antara 1 hingga 10 rujukan sesuai keluasan topik.
  const topScore = ranked[0].rerank;
  const adaptiveCandidates = ranked.filter((r, idx) => {
    if (idx === 0) return true;
    const relativeScore = r.rerank / Math.max(0.001, topScore);
    const scoreDiff = topScore - r.rerank;
    return (relativeScore >= 0.75 || scoreDiff <= 0.15) && r.rerank >= 0.40;
  });

  const maxLimit = Math.min(10, Math.max(1, topK || 10));
  const selectedCandidates = adaptiveCandidates.slice(0, maxLimit);

  // 5. Pembentukan Konteks Bukti & Metadata Sumber
  const contextBlocks: string[] = [];
  const candidateSources: LegalSourceDto[] = [];

  selectedCandidates.forEach((hit, idx) => {
    const p = hit.payload;
    const label = `S${idx + 1}`;
    const docId = p.document_id || 'UNKNOWN';
    const meta = DOCS[docId] || { title: p.title || docId, url: p.official_url || '' };
    const article = p.article_verified !== false ? p.article : undefined;
    const section = humanizeSection(p.source_section);

    const header = `[${label}] ${meta.title} | ${article || 'pasal umum'} | halaman PDF ${p.page || '-'} | ${section}`;
    const chunkText = String(p.text || '').slice(0, 2600);

    contextBlocks.push(`${header}\n${chunkText}`);
    candidateSources.push({
      id: String(hit.id),
      label,
      title: meta.title,
      article,
      page: p.page,
      official_url: meta.url,
      source_section: section,
    });
  });

  const contextStr = contextBlocks.join('\n\n');

  // 6. Siapkan Pesan untuk LLM
  const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Tambahkan riwayat multi-turn jika ada
  if (history && history.length > 0) {
    for (const h of history.slice(-4)) {
      messages.push({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      });
    }
  }

  messages.push({
    role: 'user',
    content: `KONTEKS BUKTI PASAL REGULASI HUKUM:\n${contextStr}\n\nPERTANYAAN PENGGUNA:\n${qClean}\n\nJawab pertanyaan di atas secara akurat dan berbasis bukti, sertakan sitasi [S1], [S2] pada setiap klaim regulasi.`,
  });

  // 7. Panggil LLM
  const rawAnswer = await callChatCompletion(messages);

  // 8. Normalisasi & Penomoran Ulang Sitasi (Sequential Re-indexing):
  // Masalah sebelumnya: Jika candidate ada 10 (S1..S10) dan LLM hanya mengutip S1, S6, S7, S9,
  // maka user melihat "4 rujukan" tapi labelnya ganjil sampai "S9", serta memakai huruf "S" teknis.
  // Solusi: Kita remap urutan kutipan yang muncul dalam teks menjadi [Rujukan 1], [Rujukan 2], dst.
  const labelMap = new Map<string, number>();
  let nextCitationNumber = 1;

  // Temukan semua sitasi dalam teks jawaban sesuai urutan kemunculannya
  const citationRegex = /\[(?:Rujukan|S)\s*(\d+)([^\]]*)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(rawAnswer)) !== null) {
    const origKey = `S${match[1]}`;
    if (!labelMap.has(origKey)) {
      const candidateExists = candidateSources.some((c) => c.label === origKey);
      if (candidateExists) {
        labelMap.set(origKey, nextCitationNumber);
        nextCitationNumber++;
      }
    }
  }

  let finalSources: LegalSourceDto[] = [];
  let formattedAnswer = rawAnswer;

  if (labelMap.size > 0) {
    // 1. Susun finalSources berurutan: Rujukan 1, Rujukan 2, Rujukan 3, ...
    for (const [origKey, newNum] of labelMap.entries()) {
      const found = candidateSources.find((c) => c.label === origKey);
      if (found) {
        finalSources.push({
          ...found,
          label: `Rujukan ${newNum}`,
        });
      }
    }

    // 2. Gantikan format teknis [S1], [S6] dsb. di dalam jawaban menjadi [Rujukan 1], [Rujukan 2]
    formattedAnswer = rawAnswer.replace(/\[(?:Rujukan|S)\s*(\d+)([^\]]*)\]/gi, (fullMatch, num, extra) => {
      const origKey = `S${num}`;
      const newNum = labelMap.get(origKey);
      if (newNum !== undefined) {
        const extraText = extra ? extra.trim() : '';
        return extraText ? `[Rujukan ${newNum} ${extraText}]` : `[Rujukan ${newNum}]`;
      }
      return fullMatch;
    });

    // 3. Rapikan spasi sebelum tanda baca (misal "[Rujukan 1] ." menjadi "[Rujukan 1].")
    formattedAnswer = formattedAnswer.replace(/(\[\s*Rujukan\s*\d+[^\]]*\])\s+([.,;:])/gi, '$1$2');

    // 4. Bersihkan potongan sitasi gantung di akhir teks jika sempat terputus (misal "–[S")
    formattedAnswer = formattedAnswer.replace(/[\s–-]*\[(?:Rujukan|S)[^\]]*$/i, '').trim();
  } else {
    // Jika tidak ada sitasi eksplisit yang dikutip (misal ringkasan),
    // sertakan kandidat teratas dan beri label ramah "Rujukan 1", "Rujukan 2", ...
    finalSources = candidateSources.slice(0, 3).map((c, idx) => ({
      ...c,
      label: `Rujukan ${idx + 1}`,
    }));
  }

  return {
    status: 'answered',
    answer: formattedAnswer,
    sources: finalSources,
    request_id: reqId,
    latency_seconds: (Date.now() - startTime) / 1000,
  };
}
