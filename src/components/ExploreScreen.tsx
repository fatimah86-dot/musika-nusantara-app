import React from 'react';
import { Song, ActiveScreen } from '../types';

interface ExploreScreenProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onRemix: (song: Song) => void;
  onNavigate: (screen: ActiveScreen) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  songs,
  onSelectSong,
  onRemix,
  onNavigate
}) => {
  const featuredSong = songs[0];

  return (
    <div className="pt-20 pb-28 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Hero Featured Card */}
      {featuredSong && (
        <div className="relative rounded-3xl overflow-hidden neon-halo border border-white/15 group">
          <div className="aspect-[16/10] w-full relative">
            <img
              src={featuredSong.coverUrl}
              alt={featuredSong.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent"></div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700] text-[#121212] text-[10px] font-extrabold shadow-md">
                🔥 TOP 1 VIRAL
              </span>
              <span className="text-[11px] text-[#DCB8FF] font-semibold">
                {featuredSong.genre} • 138 BPM
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {featuredSong.title}
            </h3>

            <p className="text-xs text-[#CFC2D7] line-clamp-2">
              "{featuredSong.prompt}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onSelectSong(featuredSong)}
                className="flex-1 py-3 rounded-2xl gradient-btn text-[#0A0A0A] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] font-black">play_arrow</span>
                <span>Putar Sekarang</span>
              </button>

              <button
                onClick={() => onRemix(featuredSong)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl text-[#DCB8FF] border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                <span>Remix</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories / Playlists */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-[#FFD700] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">queue_music</span>
            <span>Playlist Rekomendasi AI</span>
          </h3>
          <button
            onClick={() => onNavigate('create')}
            className="text-[11px] text-[#DCB8FF] hover:underline font-semibold"
          >
            + Buat Baru
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('create')}
            className="glass-card-interactive rounded-3xl p-4 border border-white/10 hover:border-[#FFD700]/50 transition-all cursor-pointer flex flex-col justify-between gap-3 bg-gradient-to-br from-[#8A2BE2]/15 to-transparent"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#8A2BE2] flex items-center justify-center text-white shadow-[0_0_15px_rgba(138,43,226,0.5)]">
              <span className="material-symbols-outlined text-[22px]">bolt</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Koplo Horeg Sound System</div>
              <div className="text-[10px] text-[#CFC2D7]">Sub-bass glerr & kendang muter</div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('create')}
            className="glass-card-interactive rounded-3xl p-4 border border-white/10 hover:border-[#DCB8FF]/50 transition-all cursor-pointer flex flex-col justify-between gap-3 bg-gradient-to-br from-[#FFD700]/15 to-transparent"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FFD700] flex items-center justify-center text-[#0A0A0A] shadow-[0_0_15px_rgba(255,215,0,0.5)]">
              <span className="material-symbols-outlined text-[22px] font-black">favorite</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Pop Jawa Ambyar 2026</div>
              <div className="text-[10px] text-[#CFC2D7]">Lirik menyayat hati & melodi piano</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tracks Feed */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00E479]">trending_up</span>
            <span>Lagu Koplo Populer Hari Ini</span>
          </h3>
          <span className="text-[11px] text-[#CFC2D7]">Diperbarui Real-time</span>
        </div>

        <div className="space-y-2.5">
          {songs.map((song, idx) => (
            <div
              key={song.id}
              className="glass-card-interactive rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-black text-[#FFD700] w-4 text-center">
                  {idx + 1}
                </span>

                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {song.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#CFC2D7]">
                    <span>{song.genre}</span>
                    <span>•</span>
                    <span className="text-[#FFD700] font-semibold">{(song.playCount / 1000).toFixed(1)}k play</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onSelectSong(song)}
                  className="w-10 h-10 rounded-xl gradient-btn text-[#0A0A0A] flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
                  title="Putar"
                >
                  <span className="material-symbols-outlined text-[22px] font-black">play_arrow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
