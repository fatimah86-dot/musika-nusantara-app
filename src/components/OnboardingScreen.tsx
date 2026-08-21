import React, { useState } from 'react';
import { ActiveScreen } from '../types';
import { audioPlayer } from '../services/audioSynthesizer';
import { GENRE_OPTIONS } from '../data/initialSongs';

interface OnboardingScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handleTestBeat = () => {
    if (isPlayingPreview) {
      audioPlayer.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayer.setSong(138, 'energetic', 30);
      audioPlayer.play();
      audioPlayer.playKoploVoiceCue("Tarik Sis! Semongko!");
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="pt-20 pb-28 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-6 text-center animate-fade-in">
      {/* Hero Visual Card with Neon Halo */}
      <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden neon-halo mx-auto border border-white/10 group">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH3ZAOQirzrqdP-5njxznWyQb10bhu3TYL5PA4Z4zk90OjUmya1QpwFrNWN15d3fvMDXxZjOHQkzi8tkIY1zP6aIMZDO1eZm6cEn4rpGBmew7g_H5pwxxFXIR8gk9x5gOOLeguRZl00MtnofS9NbE2SW8jpEAYpZZUZnS5Umm7uwPIgjWkePhHWQWpOqRxO-iwMY--9h1fenPiM-whGu3y3kTMWM1V0EtrweXVZA_TC7KFxiNh1dE1JA"
          alt="Musika Nusantara Koplo AI Stage"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent"></div>

        <div className="absolute bottom-4 left-4 right-4 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8A2BE2]/80 backdrop-blur-md border border-[#DCB8FF]/40 text-[11px] font-bold text-[#FFD700] mb-2 shadow-lg">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>AI Music Generator #1 Indonesia</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight drop-shadow-md">
            Dangdut Koplo • Pop Jawa • Campursari
          </h2>
        </div>
      </div>

      {/* Main Headline & Slogan */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Teks Jadi Lagu Koplo? <br />
          <span className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#DCB8FF] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            Iso Bos!
          </span>
        </h1>
        <p className="text-sm sm:text-base text-[#CFC2D7] max-w-sm mx-auto leading-relaxed">
          Tulis curhatan, cerita lucu, atau puisi cintamu. AI kami langsung sulap jadi lagu Koplo viral lengkap dengan kendang tak-tung, suling, dan lirik berima!
        </p>
      </div>

      {/* Interactive Sound Preview Pill */}
      <button
        id="btn-preview-beat"
        onClick={handleTestBeat}
        className="glass-card-interactive rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left border border-[#8A2BE2]/30 hover:border-[#FFD700]/50 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isPlayingPreview ? 'bg-[#FFD700] text-[#121212] animate-spin' : 'bg-[#8A2BE2] text-white shadow-[0_0_10px_rgba(138,43,226,0.6)]'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {isPlayingPreview ? 'stop' : 'graphic_eq'}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Tes Beat Kendang Koplo 138 BPM</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#00E479] animate-ping"></span>
            </div>
            <p className="text-[11px] text-[#CFC2D7]">
              {isPlayingPreview ? 'Sedang berputar... Klik untuk stop' : 'Klik untuk dengar ketukan kendang Tak-Tung'}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-[#FFD700] text-[20px]">
          {isPlayingPreview ? 'pause_circle' : 'play_circle'}
        </span>
      </button>

      {/* Genre Grid Showcase */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Pilihan Aliran Musik</span>
          <span className="text-[11px] text-[#CFC2D7]">6+ Genre Nusantara</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {GENRE_OPTIONS.slice(0, 4).map((g) => (
            <div
              key={g.id}
              className="glass-card rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#121212] font-bold text-sm shrink-0"
                style={{ backgroundColor: g.color }}
              >
                <span className="material-symbols-outlined text-[18px]">{g.icon}</span>
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{g.name}</div>
                <div className="text-[10px] text-[#CFC2D7] truncate">{g.defaultBpm} BPM</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Big Action Button -> goes to Create screen */}
      <div className="pt-2 flex flex-col gap-3">
        <button
          id="btn-onboarding-start"
          onClick={() => {
            if (isPlayingPreview) {
              audioPlayer.pause();
              setIsPlayingPreview(false);
            }
            onNavigate('create');
          }}
          className="w-full py-4 rounded-2xl gradient-btn text-[#121212] font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.5)] active:scale-98 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined font-bold">music_note</span>
          <span>Mulai Buat Lagu Sekarang</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>

        <button
          id="btn-onboarding-explore"
          onClick={() => onNavigate('explore')}
          className="text-xs text-[#CFC2D7] hover:text-[#DCB8FF] font-medium py-1 transition-colors cursor-pointer"
        >
          Atau Jelajahi Lagu Populer Koplo Nusantara →
        </button>
      </div>
    </div>
  );
};
