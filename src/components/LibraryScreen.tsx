import React, { useState } from 'react';
import { Song, ActiveScreen } from '../types';

interface LibraryScreenProps {
  songs: Song[];
  currentSongId?: string;
  onSelectSong: (song: Song) => void;
  onToggleFavorite: (songId: string) => void;
  onDeleteSong: (songId: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onDownloadSong: (song: Song) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  songs,
  currentSongId,
  onSelectSong,
  onToggleFavorite,
  onDeleteSong,
  onNavigate,
  onDownloadSong
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'koplo' | 'pop-jawa'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter((s) => {
    if (activeFilter === 'favorites' && !s.isFavorite) return false;
    if (activeFilter === 'koplo' && !s.genre.toLowerCase().includes('koplo')) return false;
    if (activeFilter === 'pop-jawa' && !s.genre.toLowerCase().includes('pop')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.prompt.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="pt-20 pb-28 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Koleksiku</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8A2BE2]/30 text-[#DCB8FF] border border-[#8A2BE2]/50">
              {songs.length} Lagu
            </span>
          </h2>
          <p className="text-xs text-[#CFC2D7]">Lagu AI Koplo & Musik Nusantara yang tersimpan</p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="text-xs font-bold text-[#121212] bg-[#FFD700] hover:bg-[#FFE16D] px-3 py-1.5 rounded-xl shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Buat Baru</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CFC2D7]/60 text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari lagu berdasarkan judul, tema, atau lirik..."
          className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-[#CFC2D7]/40 focus:outline-none focus:border-[#FFD700] transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#CFC2D7] hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Semua Lagu' },
          { id: 'favorites', label: 'Favorit ❤️' },
          { id: 'koplo', label: 'Dangdut Koplo' },
          { id: 'pop-jawa', label: 'Pop Jawa' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as typeof activeFilter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer backdrop-blur-md ${
              activeFilter === f.id
                ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FFD700] text-[#0A0A0A] font-extrabold shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                : 'bg-white/5 text-[#CFC2D7] hover:text-white border border-white/10 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Song List */}
      {filteredSongs.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-3 my-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#CFC2D7]">
            <span className="material-symbols-outlined text-[32px]">music_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Belum ada lagu yang sesuai</h3>
            <p className="text-xs text-[#CFC2D7] max-w-xs">
              {searchQuery ? 'Coba ubah kata kunci pencarianmu.' : 'Ayo buat lagu Koplo pertamamu dengan AI sekarang!'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('create')}
            className="mt-2 px-5 py-2.5 rounded-2xl gradient-btn text-[#121212] font-bold text-xs shadow-lg cursor-pointer"
          >
            ⚡ Buat Lagu Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSongs.map((song) => {
            const isPlayingThis = currentSongId === song.id;

            return (
              <div
                key={song.id}
                className={`glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all hover:border-[#DCB8FF]/40 ${
                  isPlayingThis
                    ? 'border-[#FFD700] bg-white/10 shadow-[0_0_20px_rgba(255,215,0,0.25)] ring-1 ring-[#FFD700]'
                    : 'border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Artwork + Play Button */}
                <div
                  onClick={() => onSelectSong(song)}
                  className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 cursor-pointer group border border-white/10"
                >
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlayingThis ? 'bg-[#8A2BE2]/60' : 'bg-black/40 group-hover:bg-black/20'}`}>
                    <span className="material-symbols-outlined text-[#FFD700] text-[26px]">
                      {isPlayingThis ? 'equalizer' : 'play_arrow'}
                    </span>
                  </div>
                </div>

                {/* Song Info */}
                <div
                  onClick={() => onSelectSong(song)}
                  className="flex-1 min-w-0 cursor-pointer space-y-0.5"
                >
                  <h4 className={`text-sm font-bold truncate ${isPlayingThis ? 'text-[#FFD700]' : 'text-white'}`}>
                    {song.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#CFC2D7]">
                    <span className="truncate">{song.genre}</span>
                    <span>•</span>
                    <span className="text-[#00E479] font-medium">{song.versions.length} Versi</span>
                  </div>
                  <p className="text-[10px] text-[#CFC2D7]/60 truncate">
                    "{song.prompt.slice(0, 45)}..."
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleFavorite(song.id)}
                    className="p-1.5 text-[#CFC2D7] hover:text-[#FF5252] transition-colors cursor-pointer"
                    aria-label="Favorit"
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${song.isFavorite ? 'text-[#FF5252]' : ''}`}
                      style={{ fontVariationSettings: song.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                  </button>

                  <button
                    onClick={() => onDownloadSong(song)}
                    className="p-1.5 text-[#CFC2D7] hover:text-[#DCB8FF] transition-colors cursor-pointer"
                    title="Download MP3"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>

                  <button
                    onClick={() => onDeleteSong(song.id)}
                    className="p-1.5 text-[#CFC2D7]/50 hover:text-[#FFB4AB] transition-colors cursor-pointer"
                    title="Hapus Lagu"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
