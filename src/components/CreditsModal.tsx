import React from 'react';

interface CreditsModalProps {
  credits: number;
  onAddCredits: (amount: number) => void;
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  credits,
  onAddCredits,
  onClose
}) => {
  const PACKAGES = [
    { id: 'free', amount: 25, title: 'Bonus Harian Sobat Koplo', desc: 'Klaim gratis tiap hari', badge: 'Gratis', isPopular: false },
    { id: 'standard', amount: 100, title: 'Paket Goyang Asik', desc: 'Bisa buat 20 lagu Koplo (40 versi)', badge: 'Paling Laris', isPopular: true },
    { id: 'pro', amount: 500, title: 'Paket Produser Horeg', desc: 'Bisa buat 100 lagu + Mastering HD', badge: 'Super Hemat', isPopular: false }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/20 flex flex-col gap-4 text-center shadow-[0_0_40px_rgba(255,215,0,0.3)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFD700] text-[24px]">monetization_on</span>
            <h3 className="text-lg font-bold text-white">Isi Saldo Kredit AI</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-[#FFD700]/40 flex items-center justify-between shadow-inner">
          <div className="text-left">
            <span className="text-[11px] text-[#CFC2D7]">Saldo Kredit Saat Ini</span>
            <div className="text-2xl font-extrabold text-[#FFD700] flex items-center gap-1.5">
              <span>{credits}</span>
              <span className="text-xs text-[#DCB8FF]">Kredit</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#00E479]/20 text-[#00E479] text-xs font-bold border border-[#00E479]/40">
            Aktif
          </span>
        </div>

        {/* Packages List */}
        <div className="space-y-2.5">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => {
                onAddCredits(pkg.amount);
                onClose();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left backdrop-blur-xl ${
                pkg.isPopular
                  ? 'bg-[#8A2BE2]/25 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-1 ring-[#FFD700]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{pkg.title}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFD700] text-[#121212] font-black">
                    +{pkg.amount}
                  </span>
                </div>
                <p className="text-[11px] text-[#CFC2D7]">{pkg.desc}</p>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-[#FFD700] hover:bg-[#FFE16D] text-[#121212] font-extrabold text-xs shrink-0 shadow-md cursor-pointer"
              >
                Klaim
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#CFC2D7] font-semibold cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
