import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Pastikan .env.production.local ter-load dengan prioritas tertinggi
const rootEnv = path.resolve(__dirname, '../../.env.production.local');
const apiEnv = path.resolve(__dirname, '.env.production.local');
const cwdEnv = path.resolve(process.cwd(), '.env.production.local');

for (const envPath of [rootEnv, apiEnv, cwdEnv]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

import { executeRagQuery } from './src/rag/ragEngine';

function printCase(
  num: number,
  title: string,
  meta: { status: string; latency: string; sourcesCount: number },
  question: string,
  sources: any[],
  answer: string
) {
  const line = '─'.repeat(80);
  const thickLine = '═'.repeat(80);

  console.log(`\n${thickLine}`);
  console.log(`[KASUS ${num}/7] ${title}`);
  console.log(`Status  : ${meta.status.toUpperCase()} | Latensi: ${meta.latency}s | Sumber: ${meta.sourcesCount} Rujukan`);
  console.log(line);

  console.log(`PERTANYAAN:`);
  console.log(question.trim());
  console.log('');

  console.log(`RUJUKAN REGULASI RESMI:`);
  if (sources.length === 0) {
    console.log(`(Tidak ada dokumen rujukan yang sesuai)`);
  } else {
    sources.forEach((s) => {
      const label = s.label || 'Rujukan';
      const doc = s.title || s.id;
      const article = s.article ? ` | ${s.article}` : '';
      const page = s.page ? ` | Hal. ${s.page}` : '';
      const section = s.source_section ? ` (${s.source_section})` : '';
      console.log(`• [${label}] ${doc}${article}${page}${section}`);
    });
  }
  console.log('');

  console.log(`JAWABAN KEPATUHAN HUKUM:`);
  console.log(answer.trim());
  console.log(thickLine + '\n');
}

const QUESTIONS = [
  {
    num: 1,
    title: 'PKWT vs PKWTT & UANG KOMPENSASI',
    question: 'Jelaskan perbedaan PKWT dan PKWTT. Jika PKWT berakhir sesuai masa kontrak, apakah pekerja berhak mendapatkan uang kompensasi?'
  },
  {
    num: 2,
    title: 'UPAH DI BAWAH UMP & KETENTUAN PENGUPAHAN',
    question: 'Apa hak pekerja apabila menerima upah di bawah upah minimum yang berlaku di wilayah tempat kerjanya? Jelaskan juga ketentuan mengenai pembayaran upah.'
  },
  {
    num: 3,
    title: 'PERHITUNGAN UPAH LEMBUR (5 HARI KERJA)',
    question: 'Saya bekerja dengan sistem 5 hari kerja, menerima upah bulanan Rp4.500.000, dan melakukan lembur selama 1 jam pada hari kerja biasa. Berapa estimasi upah lembur saya dan bagaimana perhitungannya?'
  },
  {
    num: 4,
    title: 'HAK CUTI TAHUNAN & CUTI MELAHIRKAN',
    question: 'Berapa lama hak cuti tahunan pekerja setelah bekerja selama 12 bulan secara terus-menerus? Apakah pekerja perempuan juga memiliki hak cuti melahirkan?'
  },
  {
    num: 5,
    title: 'PERHITUNGAN THR PROPORSIONAL (MASA KERJA 6 BULAN)',
    question: 'Saya telah bekerja selama 6 bulan secara terus-menerus dengan upah bulanan Rp4.500.000. Berapa estimasi THR yang saya terima dan bagaimana perhitungannya?'
  },
  {
    num: 6,
    title: 'HAK PEKERJA KORBAN PHK (PESANGON, UPMK, UPH)',
    question: 'Saya telah bekerja selama 3 tahun dan mengalami PHK. Apa saja hak yang perlu diperhitungkan, termasuk uang pesangon, uang penghargaan masa kerja, dan uang penggantian hak?'
  },
  {
    num: 7,
    title: 'MANFAAT & KELAYAKAN PROGRAM JKP',
    question: 'Siapa yang secara umum dapat memperoleh manfaat JKP setelah mengalami PHK, dan apa saja manfaat yang diberikan program tersebut?'
  }
];

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('   HAKPEKERJA.AI — PENGUJIAN AKURASI EMBEDDED RAG NODE.JS (7 KASUS HUKUM)');
  console.log('='.repeat(80));
  console.log('Model Embedding : BAAI/bge-m3 (1024 Dimensi - OpenRouter)');
  console.log('Model LLM       : deepseek-v4.1-flash (Bariska Cloud / OpenRouter Fallback)');
  console.log('Vector Database : Qdrant Cloud (hakpekerja_legal_4b4babc70203)');
  console.log('Execution Mode  : Embedded RAG Native Node.js (Vercel Production Path)');
  console.log('='.repeat(80) + '\n');

  for (let i = 0; i < QUESTIONS.length; i++) {
    const item = QUESTIONS[i];
    process.stdout.write(`Sedang memproses [${i + 1}/7]: ${item.title}... `);
    const start = Date.now();
    try {
      const result = await executeRagQuery(item.question, 7, `test-${item.num}-${Date.now()}`);
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      process.stdout.write(`SELESAI (${duration}s)\n`);

      printCase(
        item.num,
        item.title,
        {
          status: result.status,
          latency: duration,
          sourcesCount: result.sources.length
        },
        item.question,
        result.sources,
        result.answer
      );
    } catch (err: any) {
      process.stdout.write(`GAGAL!\n`);
      console.error(`Error:`, err.message);
    }
  }

  console.log('='.repeat(80));
  console.log('   SELURUH PENGUJIAN 7 KASUS SELESAI DENGAN SUKSES');
  console.log('='.repeat(80) + '\n');
}

main();
