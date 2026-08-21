import React, { useState, useEffect } from 'react';
import { Song, SongVersion } from '../types';
import { audioPlayer } from '../services/audioSynthesizer';

interface VideoLyricsModalProps {
  song: Song;
  version: SongVersion;
  onClose: () => void;
}

export const VideoLyricsModal: React.FC<VideoLyricsModalProps> = ({
  song,
  version,
  onClose
}) => {
  const [currentTime, setCurrentTime] = useState(audioPlayer.getCurrentTime());
  const [isPlaying, setIsPlaying] = useState(audioPlayer.getIsPlaying());

  useEffect(() => {
    const unsub = audioPlayer.subscribe((time, playing) => {
      setCurrentTime(time);
      setIsPlaying(playing);
    });
    return () => unsub();
  }, []);

  const currentLyricIndex = version.lyrics.findIndex((line, idx) => {
    const nextLine = version.lyrics[idx + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  const activeLine = version.lyrics[currentLyricIndex] || version.lyrics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg h-[85vh] rounded-3xl overflow-hidden glass-card border border-white/20 flex flex-col justify-between p-6 text-center shadow-[0_0_60px_rgba(138,43,226,0.4)]">
        {/* Background Visualizer */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover blur-2xl opacity-25 scale-125 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        {/* Top Header Controls */}
        <div className="flex justify-between items-center z-10">
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFD700] px-2 py-0.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30">
              KARAOKE MODE • {version.genre}
            </span>
            <h4 className="text-sm font-bold text-white mt-1 truncate max-w-[200px]">
              {song.title}
            </h4>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Centerpiece: Spinning Vinyl & Big Neon Lyrics */}
        <div className="flex flex-col items-center justify-center gap-6 my-auto z-10">
          {/* Vinyl Record */}
          <div className={`relative w-36 h-36 rounded-full border-4 border-white/20 shadow-[0_0_30px_rgba(255,215,0,0.4)] p-1 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-[#121212] border-2 border-white/30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]"></div>
            </div>
          </div>

          {/* Karaoke Active Lyrics Display */}
          <div className="space-y-3 max-w-sm px-4">
            <p className="text-2xl sm:text-3xl font-black text-[#FFD700] leading-snug drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-fade-in">
              {activeLine?.text || '♫ [Instrumen Musik Nusantara] ♫'}
            </p>

            {activeLine?.translation && (
              <p className="text-sm sm:text-base text-[#DCB8FF] font-medium italic">
                "{activeLine.translation}"
              </p>
            )}

            {activeLine?.cue && (
              <div className="inline-block px-3 py-1 rounded-full bg-[#8A2BE2] text-white font-extrabold text-xs shadow-lg animate-bounce">
                📢 {activeLine.cue}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Playback & Seeking Bar */}
        <div className="space-y-3 z-10">
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => audioPlayer.seek(Math.max(0, currentTime - 10))}
              className="text-white/70 hover:text-white p-2"
            >
              <span className="material-symbols-outlined text-[28px]">replay_10</span>
            </button>

            <button
              onClick={() => audioPlayer.togglePlay()}
              className="w-14 h-14 rounded-full gradient-btn text-[#121212] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95"
            >
              <span className="material-symbols-outlined text-[32px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              onClick={() => audioPlayer.seek(Math.min(version.duration, currentTime + 10))}
              className="text-white/70 hover:text-white p-2"
            >
              <span className="material-symbols-outlined text-[28px]">forward_10</span>
            </button>
          </div>

          <div className="text-[11px] text-[#CFC2D7]">
            Klik tombol play untuk bernyanyi karaoke bersama instrumen Koplo AI!
          </div>
        </div>
      </div>
    </div>
  );
};
