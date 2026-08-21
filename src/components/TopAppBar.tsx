import React from 'react';
import { ActiveScreen } from '../types';

interface TopAppBarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  credits: number;
  onOpenCreditsModal: () => void;
  onOpenApkModal: () => void;
  onBack?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentScreen,
  onNavigate,
  credits,
  onOpenCreditsModal,
  onOpenApkModal,
  onBack
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (currentScreen === 'player') onNavigate('library');
      else if (currentScreen === 'create') onNavigate('explore');
      else if (currentScreen === 'library') onNavigate('explore');
      else onNavigate('onboarding');
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 h-16 bg-[#0A0A0A]/60 backdrop-blur-2xl border-b border-white/10 max-w-lg md:max-w-xl mx-auto right-0 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2">
        {currentScreen !== 'onboarding' && (
          <button
            id="btn-appbar-back"
            onClick={handleBack}
            className="text-[#DCB8FF] hover:bg-white/10 transition-colors p-2 rounded-full active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('onboarding')}
          className="text-left group cursor-pointer"
        >
          <h1 className="font-extrabold text-[20px] sm:text-[22px] tracking-tight bg-gradient-to-r from-[#DCB8FF] via-[#FFD700] to-[#DCB8FF] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            Musika Nusantara
          </h1>
          <p className="text-[10px] text-[#8A2BE2] font-bold tracking-wider uppercase -mt-0.5 hidden xs:block">
            Teks Jadi Lagu Koplo? Iso Bos!
          </p>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="btn-apk-export"
          onClick={onOpenApkModal}
          className="text-[11px] font-semibold text-[#00E479] bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-[#00E479]/40 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          title="Export App / Build APK"
        >
          <span className="material-symbols-outlined text-[15px]">android</span>
          <span className="hidden sm:inline font-bold">APK</span>
        </button>

        <button
          id="btn-credits"
          onClick={onOpenCreditsModal}
          className="text-[#FFD700] font-bold text-xs sm:text-sm hover:bg-white/10 transition-all px-3 py-1.5 rounded-2xl border border-white/10 hover:border-[#FFD700]/50 active:scale-95 duration-100 flex items-center gap-1.5 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(255,215,0,0.15)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#FFD700] text-[16px]">monetization_on</span>
          <span>{credits} KREDIT</span>
        </button>
      </div>
    </header>
  );
};
