import { ExampleQuestion, LegalTopic } from '../types/chat';

export const EXAMPLE_QUESTIONS: ExampleQuestion[] = [
  {
    id: 'ex-1',
    number: '01',
    title: 'Apa beda PKWT dan PKWTT?',
    query: 'Apa perbedaan PKWT dan PKWTT menurut peraturan ketenagakerjaan?',
    colorBg: '#ECF1FF',
    colorText: '#315BF4',
  },
  {
    id: 'ex-2',
    number: '02',
    title: 'Bagaimana aturan upah lembur?',
    query: 'Berapa jam kerja normal dalam satu minggu dan bagaimana ketentuan lembur?',
    colorBg: '#E9F9F0',
    colorText: '#10B981',
  },
  {
    id: 'ex-3',
    number: '03',
    title: 'Kapan THR harus dibayarkan?',
    query: 'Kapan THR keagamaan harus dibayarkan kepada pekerja dan berapa perhitungannya?',
    colorBg: '#FFF5E6',
    colorText: '#F59E0B',
  },
];

export const LEGAL_TOPICS: LegalTopic[] = [
  {
    id: 'top-1',
    title: 'PKWT & PKWTT',
    description: 'Perjanjian kerja waktu tertentu & waktu tidak tertentu.',
    colorBg: '#ECF1FF',
    iconName: 'FileText',
  },
  {
    id: 'top-2',
    title: 'Pengupahan',
    description: 'Ketentuan struktur upah, skala upah & upah minimum.',
    colorBg: '#E9F9F0',
    iconName: 'DollarSign',
  },
  {
    id: 'top-3',
    title: 'Waktu & Lembur',
    description: 'Aturan batas jam kerja normal serta uang lembur.',
    colorBg: '#FFF5E6',
    iconName: 'Clock',
  },
  {
    id: 'top-4',
    title: 'Cuti & Istirahat',
    description: 'Hak cuti tahunan, sakit, melahirkan (UU KIA), dan istirahat.',
    colorBg: '#FFF1D9',
    iconName: 'Calendar',
  },
  {
    id: 'top-5',
    title: 'THR Keagamaan',
    description: 'Kewajiban dan perhitungan tunjangan hari raya.',
    colorBg: '#FFEAF2',
    iconName: 'Gift',
  },
  {
    id: 'top-6',
    title: 'Pemutusan Kerja (PHK)',
    description: 'Hak pesangon, penghargaan masa kerja & kompensasi.',
    colorBg: '#F3E8FF',
    iconName: 'UserMinus',
  },
  {
    id: 'top-7',
    title: 'Program JKP',
    description: 'Jaminan kehilangan pekerjaan bagi pekerja terkena PHK.',
    colorBg: '#E0F2FE',
    iconName: 'ShieldAlert',
  },
];

