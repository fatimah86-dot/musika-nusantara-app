export interface LyricLine {
  id: string;
  time: number; // in seconds
  text: string;
  translation: string;
  section?: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'kendang-drop';
  cue?: string; // e.g. "Tarik Sis!", "Hak e Hak e!"
}

export interface SongVersion {
  id: string;
  versionName: string; // e.g. "Versi 1 - Koplo", "Versi 2 - Pop Jawa"
  genre: string;
  bpm: number;
  mood: string;
  audioTone?: 'energetic' | 'mellow' | 'horeg' | 'acoustic';
  lyrics: LyricLine[];
  waveformBars: number[];
  duration: number; // in seconds
  durationFormatted: string; // e.g. "3:15"
  producerNotes: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  prompt: string;
  genre: string;
  language: string;
  vocalType: 'pria' | 'wanita' | 'duet';
  createdAt: number;
  isFavorite: boolean;
  playCount: number;
  likesCount: number;
  versions: SongVersion[];
  activeVersionIndex: number;
}

export interface GenreOption {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  defaultBpm: number;
  tags: string[];
}

export interface LanguageOption {
  id: string;
  name: string;
  sub: string;
  badge: string;
}

export type ActiveScreen = 'onboarding' | 'create' | 'player' | 'explore' | 'library';
