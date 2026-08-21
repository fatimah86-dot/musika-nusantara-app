import React, { useEffect, useState } from 'react';

interface GenerationModalProps {
  genre: string;
  onComplete: () => void;
}

const GENERATION_STEPS = [
  { step: 1, title: 'Membedah Curhatan & Tema', desc: 'Menganalisis rasa dan memilih nada pentatonik Jawa...', icon: 'psychology' },
  { step: 2, title: 'Menenun Lirik & Terjemahan', desc: 'Menyusun rima puitis dan terjemahan bahasa Indonesia...', icon: 'lyrics' },
  { step: 3, title: 'Menyusun Ketukan Kendang', desc: 'Meracik pukulan Tak-Tung & roll kendang muter...', icon: 'graphic_eq' },
  { step: 4, title: 'Aransemen Suling & Brass', desc: 'Harmonisasi melodi bambu & synth brass menggelegar...', icon: 'piano' },
  { step: 5, title: 'Mastering Koplo Horeg 138 BPM', desc: 'Menyelesaikan Versi 1 (Koplo) dan Versi 2 (Pop Jawa)...', icon: 'auto_awesome' }
];

export const GenerationModal: React.FC<GenerationModalProps> = ({ genre, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    const stepDuration = 900; // ms per step
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < GENERATION_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
      });
    }, stepDuration);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 98) {
          return prev + Math.floor(Math.random() * 8 + 4);
        }
        return 100;
      });
    }, 200);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const activeStep = GENERATION_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/90 backdrop-blur-2xl animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col items-center text-center gap-6 shadow-[0_0_50px_rgba(138,43,226,0.3)]">
        {/* Animated Neon Pulse Sound System Disk */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#8A2BE2] animate-ping opacity-30"></div>
          <div className="absolute inset-2 rounded-full border-2 border-[#FFD700] animate-pulse-slow opacity-60"></div>
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#8A2BE2] via-[#1A1A1A] to-[#FFD700] p-1 shadow-[0_0_30px_rgba(255,215,0,0.5)] flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
            <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[44px] text-[#FFD700]" style={{ fontVariationSettings: "'FILL' 1" }}>
                graphic_eq
              </span>
            </div>
          </div>
          <div className="absolute -bottom-2 bg-[#8A2BE2] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full border border-white/20 shadow-md">
            138 BPM KOPLO
          </div>
        </div>

        {/* Status Text & Current Step */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold border border-[#FFD700]/30">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>AI Music Engine • {genre}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {activeStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#CFC2D7] max-w-xs mx-auto min-h-[36px]">
            {activeStep.desc}
          </p>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-[#DCB8FF]">Langkah {activeStep.step} dari 5</span>
            <span className="text-[#FFD700]">{Math.min(progressPercent, 100)}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#1C1B1B] rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8A2BE2] via-[#00E479] to-[#FFD700] transition-all duration-300 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>

          {/* Steps Breadcrumbs */}
          <div className="flex justify-between items-center pt-2">
            {GENERATION_STEPS.map((s, idx) => (
              <div
                key={s.step}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  idx <= currentStepIndex
                    ? 'bg-[#FFD700] text-[#121212] font-black shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                    : 'bg-[#201F1F] text-[#CFC2D7]/50 border border-white/5'
                }`}
              >
                {idx < currentStepIndex ? '✓' : s.step}
              </div>
            ))}
          </div>
        </div>

        {/* Catchy Toast Banner */}
        <div className="text-[11px] text-[#CFC2D7]/70 italic flex items-center gap-1.5">
          <span>"Tarik Sis! Semongko... Lagu Koplo siap mengguncang panggung!"</span>
        </div>
      </div>
    </div>
  );
};
