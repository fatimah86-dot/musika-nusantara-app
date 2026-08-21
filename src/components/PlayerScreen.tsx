import React, { useState, useEffect, useRef } from 'react';
import { Song, SongVersion } from '../types';
import { audioPlayer } from '../services/audioSynthesizer';

interface PlayerScreenProps {
  song: Song;
  onToggleFavorite: (songId: string) => void;
  onRemix: (song: Song) => void;
  onOpenVideoLyrics: (song: Song, version: SongVersion) => void;
  onOpenShareTikTok: (song: Song) => void;
  onNextSong?: () => void;
  onPrevSong?: () => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  song,
  onToggleFavorite,
  onRemix,
  onOpenVideoLyrics,
  onOpenShareTikTok,
  onNextSong,
  onPrevSong
}) => {
  const [activeVersionIndex, setActiveVersionIndex] = useState(song.activeVersionIndex || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const currentVersion: SongVersion = song.versions[activeVersionIndex] || song.versions[0];
  const duration = currentVersion?.duration || 195;

  // Initialize and subscribe to audio synthesizer
  useEffect(() => {
    if (currentVersion) {
      audioPlayer.setSong(currentVersion.bpm, currentVersion.audioTone || 'energetic', duration);
      // Auto-play when player screen loads
      audioPlayer.play();
      setIsPlaying(true);
    }

    const unsubscribe = audioPlayer.subscribe((time, playing) => {
      setCurrentTime(time);
      setIsPlaying(playing);
    });

    return () => {
      unsubscribe();
      audioPlayer.pause();
    };
  }, [currentVersion, duration]);

  // Auto-scroll lyrics to keep active line in view
  const currentLyricIndex = currentVersion.lyrics.findIndex((line, idx) => {
    const nextLine = currentVersion.lyrics[idx + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  useEffect(() => {
    if (lyricsContainerRef.current && currentLyricIndex >= 0) {
      const activeEl = lyricsContainerRef.current.children[currentLyricIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentLyricIndex]);

  const handleTogglePlay = () => {
    audioPlayer.togglePlay();
  };

  const handleSeek = (seconds: number) => {
    audioPlayer.seek(seconds);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = percentage * duration;
    handleSeek(targetSeconds);
  };

  const handleVersionChange = (index: number) => {
    if (index === activeVersionIndex) return;
    setActiveVersionIndex(index);
    const newVer = song.versions[index];
    if (newVer) {
      audioPlayer.setSong(newVer.bpm, newVer.audioTone || 'energetic', newVer.duration);
      audioPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleDownloadMp3 = () => {
    const { url, fileName } = audioPlayer.generateAudioDownloadBlob(song.title, duration);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadToast(`MP3 "${song.title}" berhasil diunduh! 🎵`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 3500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerKoploCue = (cue: string) => {
    audioPlayer.playKoploVoiceCue(cue);
  };

  const waveformBars = currentVersion.waveformBars?.length > 0
    ? currentVersion.waveformBars
    : Array.from({ length: 32 }, () => 0.6);

  const playedProgressRatio = currentTime / duration;
  const activeBarIndex = Math.floor(playedProgressRatio * waveformBars.length);

  return (
    <main className="pt-20 pb-28 px-4 sm:px-6 max-w-lg mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#FFD700] text-[#121212] font-bold text-xs px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Segmented Control / Tabs Matching Frosted Glass */}
      <div className="flex p-1.5 bg-white/5 backdrop-blur-2xl rounded-2xl relative border border-white/15 shadow-inner">
        {/* Active Indicator with Gold Glow */}
        <div
          className="absolute inset-y-1.5 bg-white/10 border border-[#FFD700] rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.3)] backdrop-blur-md"
          style={{
            width: 'calc(50% - 6px)',
            left: activeVersionIndex === 0 ? '6px' : 'calc(50%)'
          }}
        ></div>

        <button
          id="tab-version-1"
          onClick={() => handleVersionChange(0)}
          className={`relative w-1/2 py-2.5 text-center z-10 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeVersionIndex === 0 ? 'text-[#FFD700] font-bold' : 'text-[#CFC2D7] hover:text-white'
          }`}
        >
          {song.versions[0]?.versionName || 'Versi 1 - Koplo'}
        </button>

        <button
          id="tab-version-2"
          onClick={() => handleVersionChange(1)}
          className={`relative w-1/2 py-2.5 text-center z-10 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeVersionIndex === 1 ? 'text-[#FFD700] font-bold' : 'text-[#CFC2D7] hover:text-white'
          }`}
        >
          {song.versions[1]?.versionName || 'Versi 2 - Pop Jawa'}
        </button>
      </div>

      {/* Album Art with Neon Halo */}
      <div className="aspect-square w-full rounded-3xl overflow-hidden neon-halo relative mx-auto border border-white/15 group">
        <img
          src={song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-85"></div>

        {/* Live Audio Reactive Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0A0A]/70 backdrop-blur-xl border border-[#8A2BE2]/50 text-[11px] font-bold text-[#FFD700] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00E479] animate-ping"></span>
          <span>{currentVersion.bpm} BPM • {currentVersion.mood}</span>
        </div>

        {/* Quick Koplo Cue Shoutouts Soundboard Floating */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1.5">
          <button
            onClick={() => triggerKoploCue('Tarik Sis! Semongko!')}
            className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#FFD700] hover:text-[#0A0A0A] text-[#FFD700] backdrop-blur-xl border border-[#FFD700]/50 shadow-[0_0_15px_rgba(255,215,0,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            📢 Tarik Sis!
          </button>
          <button
            onClick={() => triggerKoploCue('Hak e Hak e! Joss!')}
            className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#8A2BE2] hover:text-white text-[#DCB8FF] backdrop-blur-xl border border-[#8A2BE2]/50 shadow-[0_0_15px_rgba(138,43,226,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            🥁 Hak e Hak e!
          </button>
          <button
            onClick={() => triggerKoploCue('Buka Titik Joss!')}
            className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#00E479] hover:text-[#0A0A0A] text-[#00E479] backdrop-blur-xl border border-[#00E479]/50 shadow-[0_0_15px_rgba(0,228,121,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            🔥 Buka Titik Joss!
          </button>
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#E5E2E1] tracking-tight line-clamp-2">
          {song.title} {activeVersionIndex === 0 ? '(Koplo Version)' : '(Pop Jawa Edit)'}
        </h2>
        <p className="text-sm font-medium text-[#DCB8FF]">
          {song.artist} • <span className="text-[#CFC2D7]/70 text-xs">{currentVersion.genre}</span>
        </p>
      </div>

      {/* Player Controls Card */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
        {/* Dynamic Interactive Waveform */}
        <div
          id="audio-waveform-scrubber"
          onClick={handleWaveformClick}
          className="h-14 w-full flex items-end gap-1 px-1 cursor-pointer group relative select-none py-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"
          title="Klik bar untuk berpindah durasi lagu"
        >
          {waveformBars.map((heightFactor, idx) => {
            const isPlayed = idx <= activeBarIndex;
            const barHeightPct = Math.max(20, Math.round(heightFactor * 100));

            return (
              <div
                key={idx}
                className={`flex-1 rounded-t-sm transition-all duration-150 ${
                  isPlayed
                    ? 'bg-gradient-to-t from-[#00FF88] to-[#FFD700] shadow-[0_0_8px_rgba(0,255,136,0.4)]'
                    : 'bg-white/10 group-hover:bg-white/20'
                } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                style={{
                  height: `${barHeightPct}%`,
                  animationDelay: `${(idx % 6) * 0.08}s`
                }}
              ></div>
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center text-xs font-semibold text-[#CFC2D7] px-1">
          <span className="text-[#FFD700] font-mono font-bold">{formatTime(currentTime)}</span>
          <span className="font-mono font-bold">{formatTime(duration)}</span>
        </div>

        {/* Controls: Prev, Big Gradient Play, Next */}
        <div className="flex justify-center items-center gap-6 sm:gap-8 mt-1">
          <button
            id="btn-player-prev"
            onClick={() => {
              if (onPrevSong) onPrevSong();
              else handleSeek(Math.max(0, currentTime - 10));
            }}
            className="text-[#CFC2D7] hover:text-[#DCB8FF] transition-all active:scale-90 p-2 cursor-pointer"
            aria-label="Lagu Sebelumnya / Mundur 10 detik"
          >
            <span className="material-symbols-outlined text-[32px]">skip_previous</span>
          </button>

          {/* Big Center Play/Pause Button */}
          <button
            id="btn-player-toggle-play"
            onClick={handleTogglePlay}
            className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center text-[#0A0A0A] active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.6)] cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span
              className="material-symbols-outlined text-[36px] font-black"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            id="btn-player-next"
            onClick={() => {
              if (onNextSong) onNextSong();
              else handleSeek(Math.min(duration, currentTime + 10));
            }}
            className="text-[#CFC2D7] hover:text-[#DCB8FF] transition-all active:scale-90 p-2 cursor-pointer"
            aria-label="Lagu Selanjutnya / Maju 10 detik"
          >
            <span className="material-symbols-outlined text-[32px]">skip_next</span>
          </button>
        </div>
      </div>

      {/* Lyrics Section */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#DCB8FF]">lyrics</span>
            <span>Lirik Lagu</span>
          </h3>

          <button
            id="btn-toggle-translation"
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              showTranslation
                ? 'bg-[#00E479]/20 text-[#00E479] border-[#00E479]'
                : 'text-[#DCB8FF] bg-white/5 border-white/15 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            <span>{showTranslation ? 'Teks Asli (Jawa)' : 'Jawa -> Indonesia'}</span>
          </button>
        </div>

        {/* Scrollable Interactive Lyrics */}
        <div
          ref={lyricsContainerRef}
          className="h-36 overflow-y-auto lyrics-scroll pr-2 space-y-2.5 mt-1 select-none"
        >
          {currentVersion.lyrics.map((line, idx) => {
            const isActive = idx === currentLyricIndex;

            return (
              <div
                key={line.id || idx}
                onClick={() => handleSeek(line.time)}
                className={`transition-all duration-200 cursor-pointer rounded-xl p-2 ${
                  isActive
                    ? 'text-[#FFD700] font-bold text-base bg-white/10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] border-l-3 border-[#FFD700] pl-2.5 backdrop-blur-md'
                    : 'text-[#CFC2D7]/50 hover:text-[#CFC2D7] text-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{showTranslation ? line.translation : line.text}</span>
                  {line.cue && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#8A2BE2]/40 text-[#DCB8FF] font-medium shrink-0 ml-2 border border-[#8A2BE2]/40">
                      {line.cue}
                    </span>
                  )}
                </div>
                {/* Secondary translation subline if active */}
                {isActive && !showTranslation && line.translation && (
                  <p className="text-xs text-[#CFC2D7]/80 font-normal italic mt-0.5">
                    ({line.translation})
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action 5-Button Grid with Frosted Glass Interactivity */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-2">
        {/* Favorit */}
        <button
          id="btn-player-favorite"
          onClick={() => onToggleFavorite(song.id)}
          className="glass-card-interactive flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl active:scale-95 cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[24px] ${song.isFavorite ? 'text-[#FF5252]' : 'text-[#FFB4AB]'}`}
            style={{ fontVariationSettings: song.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span className="text-xs font-semibold text-[#E5E2E1]">
            {song.isFavorite ? 'Favorit ❤️' : 'Favorit'}
          </span>
        </button>

        {/* Share TikTok */}
        <button
          id="btn-player-share-tiktok"
          onClick={() => onOpenShareTikTok(song)}
          className="glass-card-interactive flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#00E479] text-[24px]">share</span>
          <span className="text-xs font-semibold text-[#E5E2E1]">Share TikTok</span>
        </button>

        {/* Download MP3 */}
        <button
          id="btn-player-download-mp3"
          onClick={handleDownloadMp3}
          className="glass-card-interactive flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#DCB8FF] text-[24px]">download</span>
          <span className="text-xs font-semibold text-[#E5E2E1]">Download MP3</span>
        </button>

        {/* Video Lirik */}
        <button
          id="btn-player-video-lyrics"
          onClick={() => onOpenVideoLyrics(song, currentVersion)}
          className="glass-card-interactive flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#FFE16D] text-[24px]">movie</span>
          <span className="text-xs font-semibold text-[#E5E2E1]">Video Lirik</span>
        </button>

        {/* Remix / Buat Ulang */}
        <button
          id="btn-player-remix"
          onClick={() => onRemix(song)}
          className="glass-card-interactive flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl active:scale-95 cursor-pointer col-span-2 sm:col-span-1"
        >
          <span className="material-symbols-outlined text-[#FFD700] text-[24px]">graphic_eq</span>
          <span className="text-xs font-semibold text-[#E5E2E1]">Remix</span>
        </button>
      </div>
    </main>
  );
};
