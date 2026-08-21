import React from 'react';
import { ActiveScreen } from '../types';

interface BottomNavBarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onNavigate
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around items-end pb-3 pt-2 px-4 bg-[#0A0A0A]/70 backdrop-blur-2xl border-t border-x border-white/10 rounded-t-[32px] shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)] max-w-lg md:max-w-xl mx-auto">
      {/* Explore Tab */}
      <button
        id="nav-explore"
        onClick={() => onNavigate('explore')}
        className={`flex flex-col items-center justify-center py-1 px-3 transition-all cursor-pointer ${
          currentScreen === 'explore'
            ? 'text-[#FFD700] scale-105 font-bold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'
            : 'text-[#CFC2D7] hover:text-[#DCB8FF]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={currentScreen === 'explore' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          explore
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight font-semibold">Explore</span>
      </button>

      {/* FAB for 'Create' (Centerpiece) */}
      <div className="relative -top-4 flex flex-col items-center">
        <button
          id="nav-create-fab"
          onClick={() => onNavigate('create')}
          className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-transform active:scale-95 cursor-pointer ${
            currentScreen === 'create'
              ? 'bg-gradient-to-tr from-[#8A2BE2] to-[#FFD700] text-[#0A0A0A] shadow-[0_0_30px_rgba(255,215,0,0.7)] scale-105 ring-2 ring-white/40'
              : 'bg-gradient-to-tr from-[#8A2BE2] to-[#FFD700] text-[#0A0A0A] shadow-[0_0_25px_rgba(138,43,226,0.5)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)]'
          }`}
          aria-label="Buat Lagu Baru"
        >
          <span className="material-symbols-outlined text-[30px] font-black">add</span>
        </button>
        <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${currentScreen === 'create' ? 'text-[#FFD700]' : 'text-[#DCB8FF]'}`}>
          Create
        </span>
      </div>

      {/* Koleksiku / Library Tab */}
      <button
        id="nav-library"
        onClick={() => onNavigate('library')}
        className={`flex flex-col items-center justify-center py-1 px-3 transition-all cursor-pointer ${
          currentScreen === 'library'
            ? 'text-[#FFD700] scale-105 font-bold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'
            : 'text-[#CFC2D7] hover:text-[#DCB8FF]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={currentScreen === 'library' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          library_music
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight font-semibold">Koleksiku</span>
      </button>
    </nav>
  );
};
