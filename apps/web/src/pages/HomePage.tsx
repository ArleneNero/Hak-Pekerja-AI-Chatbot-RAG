import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar, 
  Gift, 
  UserMinus, 
  ShieldAlert, 
  ShieldCheck
} from 'lucide-react';
import { EXAMPLE_QUESTIONS, LEGAL_TOPICS } from '../constants/figmaTokens';
import { ROUTES } from '../constants/routes';

export const HomePage: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    navigate(`${ROUTES.CHAT}?q=${encodeURIComponent(inputQuery.trim())}`);
  };

  const handleSelectExample = (query: string) => {
    navigate(`${ROUTES.CHAT}?q=${encodeURIComponent(query)}`);
  };

  const renderTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText size={20} className="text-[#285CF5]" />;
      case 'DollarSign': return <DollarSign size={20} className="text-[#15876B]" />;
      case 'Clock': return <Clock size={20} className="text-[#A05E03]" />;
      case 'Calendar': return <Calendar size={20} className="text-[#D44333]" />;
      case 'Gift': return <Gift size={20} className="text-[#7053DC]" />;
      case 'UserMinus': return <UserMinus size={20} className="text-[#C83370]" />;
      case 'ShieldAlert': return <ShieldAlert size={20} className="text-[#1E78B4]" />;
      default: return <FileText size={20} className="text-[#285CF5]" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8">
      {/* 1. HERO EDITORIAL BANNER */}
      <div 
        className="relative overflow-hidden rounded-[28px] border border-[#D5DFE9] p-6 sm:p-8 lg:p-11 min-h-[260px] sm:min-h-[280px] flex items-center shadow-[0px_10px_24px_-8px_rgba(30,48,80,0.08)] bg-[#DFE8F0]"
        style={{
          backgroundImage: "url('/assets/hero-banner-bg.png')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: 'cover'
        }}
      >
        {/* Soft mobile overlay to guarantee text contrast on small screens */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EDF3F9]/95 via-[#DFE8F0]/85 to-transparent sm:hidden pointer-events-none" />

        <div className="max-w-xl z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1A2952] leading-[1.18] tracking-tight">
            Tanya apa saja tentang <br />
            <span className="text-4xl sm:text-5xl lg:text-[48px] font-extrabold text-[#285CF5] block mt-1">
              hak ketenagakerjaan Anda
            </span>
          </h1>

          <p className="text-[13.5px] sm:text-[14.5px] text-[#4F607B] font-medium leading-relaxed mt-4 max-w-lg">
            Kecerdasan Buatan berdasar regulasi ketenagakerjaan Indonesia. Temukan jawaban hak lembur, kontrak, hingga pesangon dengan transparansi pasal hukum resmi.
          </p>
        </div>
      </div>

      {/* 2. PRIMARY QUESTION COMPOSER (Figma V6 #116:11) */}
      <div className="relative">
        <form 
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white rounded-[22px] border border-[#DFE9F8] shadow-[0px_10px_24px_-7px_rgba(51,87,166,0.09)] p-2.5 sm:p-3 focus-within:border-[#315BF4] focus-within:ring-4 focus-within:ring-[#315BF4]/10 transition-all"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Tulis pertanyaan Anda di sini... (contoh: Kapan THR wajib dibayarkan?)"
            className="flex-1 px-4 py-3 text-[14.5px] text-[#1D2737] placeholder-[#7D8DA8] bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="shrink-0 h-12 px-6 rounded-[16px] bg-[#315BF4] hover:bg-[#2045D4] disabled:bg-[#A9B7CD] disabled:cursor-not-allowed text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            <span>Tanyakan</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* 3. CONTOH PERTANYAAN (Figma V6 #116:22) */}
      <div>
        <p className="text-[12px] font-bold text-[#7D8DA8] uppercase tracking-wider mb-3 px-1">
          Pertanyaan Populer yang Sering Ditanyakan
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {EXAMPLE_QUESTIONS.map((ex) => (
            <div
              key={ex.id}
              onClick={() => handleSelectExample(ex.query)}
              className="group p-4 rounded-[18px] bg-white border border-[#E8EDF4] hover:border-[#315BF4]/40 hover:shadow-[0px_8px_20px_-6px_rgba(48,82,163,0.12)] cursor-pointer transition-all flex items-center gap-3.5"
            >
              <div 
                className="w-10 h-10 rounded-[12px] flex items-center justify-center font-extrabold text-[13px] shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: ex.colorBg, color: ex.colorText }}
              >
                {ex.number}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[13.5px] font-bold text-[#1D2737] group-hover:text-[#315BF4] transition-colors line-clamp-2 leading-snug">
                  {ex.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#E8EDF4]" />

      {/* 4. INFORMASI 7 CAKUPAN TOPIK (Figma V6 #116:41-75) */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-[16px] font-bold text-[#1D2737]">
              7 Cakupan Regulasi Ketenagakerjaan
            </h2>
            <p className="text-[12.5px] text-[#7D8DA8]">
              Materi terindeks dari 11 dokumen hukum resmi Republik Indonesia
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7FAFF] text-[#315BF4] text-[11.5px] font-bold border border-[#E8EDF4]">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Koleksi Terverifikasi</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {LEGAL_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="p-4 rounded-[18px] bg-white border border-[#E8EDF4] flex items-start gap-3.5 shadow-sm hover:border-[#E0EAF9] transition-colors"
            >
              <div 
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: topic.colorBg }}
              >
                {renderTopicIcon(topic.iconName)}
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-bold text-[#1D2737] mb-1 leading-tight">
                  {topic.title}
                </h3>
                <p className="text-[11.5px] text-[#7D8DA8] leading-snug">
                  {topic.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DISCLAIMER FOOTER */}
      <footer className="pt-6 pb-2 text-center text-[12px] text-[#7D8DA8] space-y-1 border-t border-[#F0F4FF]">
        <p className="font-semibold text-[#42506A]">
          HakKetenagakerjaan.AI — Asisten Regulasi Hukum Ketenagakerjaan Berbasis Bukti
        </p>
        <p>
          Informasi yang disajikan adalah rujukan umum peraturan perundang-undangan dan bukan pengganti konsultasi hukum atau keputusan pengadilan.
        </p>
      </footer>
    </div>
  );
};
