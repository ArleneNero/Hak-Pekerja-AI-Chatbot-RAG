import path from 'path';
import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

// Pastikan .env.production.local ter-load
const rootEnv = path.resolve(__dirname, '../../.env.production.local');
const apiEnv = path.resolve(__dirname, '.env.production.local');
const cwdEnv = path.resolve(process.cwd(), '.env.production.local');

for (const envPath of [rootEnv, apiEnv, cwdEnv]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

import { executeRagQuery } from './src/rag/ragEngine';

function waitKeyPress(promptText: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(promptText, () => {
      rl.close();
      resolve();
    });
  });
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
  for (let i = 0; i < QUESTIONS.length; i++) {
    console.clear();
    const item = QUESTIONS[i];
    console.log('='.repeat(75));
    console.log(`[KASUS ${item.num}/7] ${item.title}`);
    console.log('Sedang memproses query ke Embedded RAG... Mohon tunggu sebentar...');
    console.log('='.repeat(75));

    const start = Date.now();
    try {
      const result = await executeRagQuery(item.question, 7, `test-${item.num}-${Date.now()}`);
      const duration = ((Date.now() - start) / 1000).toFixed(2);

      console.clear();
      console.log('='.repeat(75));
      console.log(`[KASUS ${item.num}/7] ${item.title}`);
      console.log(`Status  : ${result.status.toUpperCase()} | Latensi: ${duration}s | Sumber: ${result.sources.length} Rujukan`);
      console.log('-'.repeat(75));
      console.log(`PERTANYAAN:`);
      console.log(item.question);
      console.log('');
      console.log(`RUJUKAN UTAMA:`);
      result.sources.slice(0, 3).forEach((s) => {
        console.log(`• [${s.label}] ${s.title}${s.article ? ` (${s.article})` : ''} Hal. ${s.page || '-'}`);
      });
      console.log('');
      console.log(`RINGKASAN JAWABAN HUKUM:`);
      console.log(result.answer);
      console.log('='.repeat(75));

      if (i < QUESTIONS.length - 1) {
        console.log(`\n>> Layar siap di-Screenshot! (Win + Shift + S)`);
        await waitKeyPress(`>> Tekan [ENTER] jika sudah selesai SS untuk lanjut ke Kasus ${i + 2}...`);
      } else {
        console.log(`\n>> Seluruh 7 kasus selesai! Layar siap di-Screenshot.`);
      }
    } catch (e: any) {
      console.error('Error:', e.message);
      await waitKeyPress('>> Tekan [ENTER] untuk lanjut...');
    }
  }
}

main();

