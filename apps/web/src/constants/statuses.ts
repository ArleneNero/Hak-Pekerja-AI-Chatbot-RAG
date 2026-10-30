import { RagStatus } from '@/types/chat';

export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const RAG_STATUS_CONFIG: Record<RagStatus, StatusConfig> = {
  answered: {
    label: 'Terverifikasi Rujukan',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  insufficient_evidence: {
    label: 'Bukti Regulasi Terbatas',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  needs_review: {
    label: 'Perlu Penelaahan Lanjutan',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  out_of_scope: {
    label: 'Di Luar Cakupan Topik',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  invalid_question: {
    label: 'Pertanyaan Tidak Valid',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
  },
  service_unavailable: {
    label: 'Gangguan Layanan',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
};

