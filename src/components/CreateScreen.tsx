import React, { useState } from 'react';
import { GENRE_OPTIONS, LANGUAGE_OPTIONS, INSPIRATION_PROMPTS } from '../data/initialSongs';

interface CreateScreenProps {
  initialPrompt?: string;
  initialGenre?: string;
  credits: number;
  onGenerate: (params: {
    prompt: string;
    genre: string;
    language: string;
    vocalType: 'pria' | 'wanita' | 'duet';
  }) => void;
  onOpenCreditsModal: () => void;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({
  initialPrompt = '',
  initialGenre = 'Dangdut Koplo',
  credits,
  onGenerate,
  onOpenCreditsModal
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedLanguage, setSelectedLanguage] = useState('Jawa Ngoko');
  const [selectedVocal, setSelectedVocal] = useState<'pria' | 'wanita' | 'duet'>('wanita');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectInspiration = (text: string) => {
    setPrompt(text);
    setErrorMsg('');
  };

  const handleRandomInspiration = () => {
    const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(random);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setErrorMsg('Tolong tulis cerita, curhatan, atau ide lagumu dulu ya Bos!');
      return;
    }
    if (credits < 5) {
      onOpenCreditsModal();
      return;
    }

    onGenerate({
      prompt: prompt.trim(),
      genre: selectedGenre,
      language: selectedLanguage,
      vocalType: selectedVocal
    });
  };

  return (
    <div className="pt-20 pb-28 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-5 animate-fade-in">
      {/* Header Info */}
      <div className="text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8A2BE2]/20 border border-[#8A2BE2]/40 text-[11px] font-bold text-[#DCB8FF]">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          <span>Studio Pembuat Lagu AI</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Buat Lagu Nusantara
        </h2>
        <p className="text-xs text-[#CFC2D7]">
          Tulis cerita atau curhatanmu, AI akan menyusun lirik berima & 2 versi lagu siap goyang!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Prompt Input Section */}
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label htmlFor="input-prompt" className="text-xs font-bold text-[#FFD700] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Cerita / Tema / Curhatan Lagu</span>
            </label>
            <button
              type="button"
              id="btn-random-inspiration"
              onClick={handleRandomInspiration}
              className="text-[11px] text-[#DCB8FF] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">shuffle</span>
              <span>Acak Ide</span>
            </button>
          </div>

          <textarea
            id="input-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            rows={3}
            placeholder="Contoh: Kisah ditinggal rabi pas lagi sayang-sayange, padahal wes nabung tuku ali-ali tapi wonge malah milih liyane..."
            className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-xl p-3 text-sm text-white placeholder:text-[#CFC2D7]/40 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all resize-none shadow-inner"
          />

          {errorMsg && (
            <p className="text-xs text-[#FFB4AB] flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {errorMsg}
            </p>
          )}

          {/* Quick Inspiration Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#CFC2D7]/70">
              Inspirasi Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_PROMPTS.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectInspiration(item)}
                  className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#E5E2E1] border border-white/10 backdrop-blur-md transition-all truncate max-w-full cursor-pointer hover:border-[#DCB8FF]/40"
                >
                  "{item.slice(0, 38)}..."
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style / Genre Selection Chips */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD700] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">style</span>
              <span>Pilih Genre Musik</span>
            </span>
            <span className="text-[11px] text-[#CFC2D7] font-semibold">{selectedGenre}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GENRE_OPTIONS.map((g) => {
              const isSelected = selectedGenre === g.name;
              return (
                <button
                  key={g.id}
                  type="button"
                  id={`chip-genre-${g.id}`}
                  onClick={() => setSelectedGenre(g.name)}
                  className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between gap-1.5 backdrop-blur-xl ${
                    isSelected
                      ? 'bg-[#8A2BE2]/25 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-1 ring-[#FFD700]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: isSelected ? '#FFD700' : g.color }}
                    >
                      {g.icon}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[#FFD700] text-[16px]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
                      {g.name}
                    </div>
                    <div className="text-[10px] text-[#CFC2D7] truncate">{g.defaultBpm} BPM</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language & Vocalist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Language Dropdown */}
          <div className="glass-card rounded-2xl p-3 space-y-1.5 relative">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#00E479]">translate</span>
                <span>Bahasa Lirik</span>
              </span>
            </label>

            <button
              type="button"
              id="btn-select-language"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 text-xs text-white hover:border-[#DCB8FF]/50 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-[#FFD700]">{selectedLanguage}</span>
              <span className="material-symbols-outlined text-[18px]">
                {isDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#131313]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden py-1">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${
                      selectedLanguage === lang.name ? 'bg-[#8A2BE2]/30 text-[#FFD700] font-bold' : 'text-white'
                    }`}
                  >
                    <div>
                      <div>{lang.name}</div>
                      <div className="text-[10px] text-[#CFC2D7]">{lang.sub}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#DCB8FF]">
                      {lang.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vocalist Style Selector */}
          <div className="glass-card rounded-2xl p-3 space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#FFD700]">mic</span>
              <span>Karakter Vokal</span>
            </label>

            <div className="grid grid-cols-3 gap-1 bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedVocal('wanita')}
                className={`py-1.5 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                  selectedVocal === 'wanita'
                    ? 'bg-[#8A2BE2] text-white shadow-[0_0_12px_rgba(138,43,226,0.6)]'
                    : 'text-[#CFC2D7] hover:text-white'
                }`}
              >
                Sinden 👩
              </button>
              <button
                type="button"
                onClick={() => setSelectedVocal('pria')}
                className={`py-1.5 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                  selectedVocal === 'pria'
                    ? 'bg-[#8A2BE2] text-white shadow-[0_0_12px_rgba(138,43,226,0.6)]'
                    : 'text-[#CFC2D7] hover:text-white'
                }`}
              >
                Cak Percil 👨
              </button>
              <button
                type="button"
                onClick={() => setSelectedVocal('duet')}
                className={`py-1.5 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                  selectedVocal === 'duet'
                    ? 'bg-[#8A2BE2] text-white shadow-[0_0_12px_rgba(138,43,226,0.6)]'
                    : 'text-[#CFC2D7] hover:text-white'
                }`}
              >
                Duet 👥
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button Banner */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs text-[#CFC2D7] px-1">
            <span>Biaya Pembuatan: <strong className="text-[#FFD700]">5 Kredit</strong></span>
            <span>Sisa Saldo: <strong className="text-[#00E479]">{credits} Kredit</strong></span>
          </div>

          <button
            type="submit"
            id="btn-submit-generate"
            className="w-full py-4 rounded-2xl gradient-btn text-[#121212] font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(255,215,0,0.5)] active:scale-98 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            <span>⚡ Generate Lagu Koplo (2 Versi)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
