import React, { useEffect } from 'react';
import { X, ExternalLink, BookOpen, FileCheck, Shield } from 'lucide-react';
import { LegalSource } from '../../types/chat';

/** Terjemahkan kode section internal ke label hukum yang mudah dipahami masyarakat */
const SECTION_LABEL: Record<string, string> = {
  regulation_body: 'Batang Tubuh Peraturan',
  explanation: 'Penjelasan Resmi Regulasi',
  court_text: 'Pertimbangan Putusan Hakim',
  preamble: 'Bagian Pembukaan',
  annex: 'Lampiran Peraturan',
  definition: 'Ketentuan Umum / Definisi',
  transitional: 'Ketentuan Peralihan',
  closing: 'Ketentuan Penutup',
  unknown: 'Pasal Pokok',
};

interface LegalSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: LegalSource[];
}

export const LegalSourceModal: React.FC<LegalSourceModalProps> = ({
  isOpen,
  onClose,
  sources,
}) => {
  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal / Sheet Container */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-[#E8EDF4] flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Mobile Swipe Handle */}
        <div className="md:hidden w-12 h-1.5 bg-[#E8EDF4] rounded-full mx-auto my-3" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F0F4FF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECF1FF] text-[#315BF4] flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 id="modal-headline" className="text-[16px] font-bold text-[#1D2737]">
                Rujukan Regulasi Resmi
              </h2>
              <p className="text-[12px] text-[#7D8DA8]">
                {sources.length} kutipan pasal hukum yang diverifikasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7D8DA8] hover:text-[#1D2737] hover:bg-[#F7FAFF] transition-colors"
            aria-label="Tutup dialog rujukan"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Sources List */}
        <div className="px-6 py-4 overflow-y-auto space-y-3.5 flex-1 divide-y divide-[#F0F4FF]">
          {sources.length === 0 ? (
            <div className="text-center py-8 text-[#7D8DA8]">
              <Shield size={32} className="mx-auto mb-2 text-[#A9B7CD]" />
              <p className="text-sm">Tidak ada rujukan hukum eksplisit yang dilampirkan.</p>
            </div>
          ) : (
            sources.map((source, idx) => (
              <div key={idx} className={`${idx > 0 ? 'pt-3.5' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#315BF4] text-white text-[11px] font-bold">
                        {source.label || `Rujukan ${idx + 1}`}
                      </span>

                      {source.article && (
                        <span className="px-2 py-0.5 rounded-md bg-[#ECF1FF] text-[#315BF4] text-[11px] font-bold flex items-center gap-1">
                          <FileCheck size={12} />
                          {source.article}
                        </span>
                      )}

                      {source.page && (
                        <span className="text-[11px] font-medium text-[#7D8DA8] bg-[#F7FAFF] border border-[#E8EDF4] px-1.5 py-0.5 rounded">
                          Hal. PDF {source.page}
                        </span>
                      )}
                    </div>

                    <h3 className="text-[14px] font-bold text-[#1D2737] leading-snug mb-1">
                      {source.title}
                    </h3>

                    {source.source_section && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#7D8DA8]">
                        <span>Bagian:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F4F7FC] text-[#42506A] font-medium text-[11px] border border-[#E8EDF4]">
                          {SECTION_LABEL[source.source_section] ?? source.source_section}
                        </span>
                      </div>
                    )}
                  </div>

                  {source.official_url && (
                    <a
                      href={source.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-xl bg-[#F7FAFF] hover:bg-[#ECF1FF] text-[#315BF4] border border-[#E8EDF4] hover:border-[#315BF4]/30 transition-colors flex items-center gap-1 text-[12px] font-semibold"
                      title="Buka dokumen resmi di JDIH/BPK"
                    >
                      <span>JDIH / BPK</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F7FAFF] border-t border-[#E8EDF4] flex items-center justify-between text-[11.5px] text-[#7D8DA8]">
          <span>Data terintegrasi JDIH Kemnaker & JDIH BPK RI</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-[#E8EDF4] text-[#1D2737] font-semibold hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

