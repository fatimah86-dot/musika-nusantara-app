import React, { useState } from 'react';
import { Song } from '../types';

interface ShareTikTokModalProps {
  song: Song;
  onClose: () => void;
}

export const ShareTikTokModal: React.FC<ShareTikTokModalProps> = ({ song, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `🔥 Dengarkan lagu Koplo AI "${song.title}" buatan Musika Nusantara!\n\n"${song.prompt}"\n\n#MusikaNusantara #KoploAI #DangdutKoplo #PopJawaAmbyar #TeksJadiLaguKoplo #TikTokMusic`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/20 flex flex-col gap-4 text-center shadow-[0_0_40px_rgba(0,228,121,0.3)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00E479] text-[24px]">share</span>
            <h3 className="text-lg font-bold text-white">Share ke TikTok</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Track Card Preview */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10 text-left">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-14 h-14 rounded-xl object-cover border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
            <p className="text-xs text-[#FFD700]">Sound: {song.title} - @MusikaNusantara</p>
            <p className="text-[11px] text-[#CFC2D7]">{song.genre} • 138 BPM</p>
          </div>
        </div>

        {/* Caption & Hashtags Box */}
        <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-left shadow-inner">
          <label className="text-[10px] font-bold text-[#DCB8FF] uppercase tracking-wider block mb-1">
            Template Caption & Sound Tag TikTok:
          </label>
          <p className="text-xs text-[#E5E2E1] whitespace-pre-line leading-relaxed font-mono">
            {shareText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="w-full py-3.5 rounded-xl bg-[#00E479] hover:bg-[#00c968] text-[#121212] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,228,121,0.4)] active:scale-98 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Caption Tersalin ke Clipboard! ✓' : 'Salin Caption & Tag TikTok'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#CFC2D7] font-semibold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
