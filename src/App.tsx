import { useState, useEffect } from 'react';
import { Song, SongVersion, ActiveScreen } from './types';
import { INITIAL_SONGS } from './data/initialSongs';
import { generateKoploSong } from './services/geminiService';
import { audioPlayer } from './services/audioSynthesizer';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CreateScreen } from './components/CreateScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { ExploreScreen } from './components/ExploreScreen';
import { GenerationModal } from './components/GenerationModal';
import { VideoLyricsModal } from './components/VideoLyricsModal';
import { ShareTikTokModal } from './components/ShareTikTokModal';
import { CreditsModal } from './components/CreditsModal';
import { ExportApkModal } from './components/ExportApkModal';

const STORAGE_SONGS_KEY = 'musika_nusantara_songs_v1';
const STORAGE_CREDITS_KEY = 'musika_nusantara_credits_v1';

export default function App() {
  // Load initial state from storage or defaults
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SONGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // localstorage fallback
    }
    return INITIAL_SONGS;
  });

  const [credits, setCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CREDITS_KEY);
      if (saved) return parseInt(saved, 10);
    } catch {
      // fallback
    }
    return 50;
  });

  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('player');
  const [currentSong, setCurrentSong] = useState<Song>(() => songs[0] || INITIAL_SONGS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationGenre, setGenerationGenre] = useState('Dangdut Koplo');
  const [pendingGeneratedSong, setPendingGeneratedSong] = useState<Song | null>(null);

  // Prefill data for Create screen (e.g. from Remix button)
  const [prefillPrompt, setPrefillPrompt] = useState('');
  const [prefillGenre, setPrefillGenre] = useState('Dangdut Koplo');

  // Modals state
  const [videoLyricsData, setVideoLyricsData] = useState<{ song: Song; version: SongVersion } | null>(null);
  const [shareTikTokSong, setShareTikTokSong] = useState<Song | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SONGS_KEY, JSON.stringify(songs));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CREDITS_KEY, credits.toString());
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [credits]);

  // Handle Generation flow
  const handleStartGenerate = async (params: {
    prompt: string;
    genre: string;
    language: string;
    vocalType: 'pria' | 'wanita' | 'duet';
  }) => {
    setGenerationGenre(params.genre);
    setIsGenerating(true);
    setCredits((prev) => Math.max(0, prev - 5));

    try {
      const newSong = await generateKoploSong(params);
      setPendingGeneratedSong(newSong);
    } catch (err) {
      console.error("Song generation failed:", err);
    }
  };

  const handleGenerationModalComplete = () => {
    setIsGenerating(false);
    if (pendingGeneratedSong) {
      setSongs((prev) => [pendingGeneratedSong, ...prev]);
      setCurrentSong(pendingGeneratedSong);
      setPendingGeneratedSong(null);
      setCurrentScreen('player');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (songId: string) => {
    setSongs((prev) =>
      prev.map((s) => {
        if (s.id === songId) {
          const updated = { ...s, isFavorite: !s.isFavorite };
          if (currentSong?.id === songId) {
            setCurrentSong(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  // Delete song
  const handleDeleteSong = (songId: string) => {
    setSongs((prev) => {
      const filtered = prev.filter((s) => s.id !== songId);
      if (currentSong?.id === songId && filtered.length > 0) {
        setCurrentSong(filtered[0]);
      }
      return filtered;
    });
  };

  // Select song from Library or Explore
  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentScreen('player');
  };

  // Remix song
  const handleRemix = (song: Song) => {
    setPrefillPrompt(`Remix dari "${song.title}": ${song.prompt}`);
    setPrefillGenre(song.genre);
    setCurrentScreen('create');
  };

  // Next / Prev song in player
  const handleNextSong = () => {
    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex >= 0 && currentIndex < songs.length - 1) {
      setCurrentSong(songs[currentIndex + 1]);
    } else if (songs.length > 0) {
      setCurrentSong(songs[0]);
    }
  };

  const handlePrevSong = () => {
    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex > 0) {
      setCurrentSong(songs[currentIndex - 1]);
    } else if (songs.length > 0) {
      setCurrentSong(songs[songs.length - 1]);
    }
  };

  // Download song handler
  const handleDownloadSong = (song: Song) => {
    const activeVer = song.versions[song.activeVersionIndex || 0] || song.versions[0];
    const { url, fileName } = audioPlayer.generateAudioDownloadBlob(song.title, activeVer?.duration || 195);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E2E1] flex flex-col justify-between selection:bg-[#8A2BE2] selection:text-white relative font-body-md overflow-x-hidden">
      {/* Frosted Glass Background Ambient Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#8A2BE2]/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#FFD700]/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-[#8A2BE2]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <TopAppBar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        credits={credits}
        onOpenCreditsModal={() => setShowCreditsModal(true)}
        onOpenApkModal={() => setShowApkModal(true)}
        onBack={() => {
          if (currentScreen === 'player') setCurrentScreen('library');
          else if (currentScreen === 'create') setCurrentScreen('explore');
          else if (currentScreen === 'library') setCurrentScreen('explore');
          else setCurrentScreen('onboarding');
        }}
      />

      {/* Main Screen Content */}
      <div className="flex-1 w-full max-w-lg md:max-w-xl mx-auto">
        {currentScreen === 'onboarding' && (
          <OnboardingScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'create' && (
          <CreateScreen
            initialPrompt={prefillPrompt}
            initialGenre={prefillGenre}
            credits={credits}
            onGenerate={handleStartGenerate}
            onOpenCreditsModal={() => setShowCreditsModal(true)}
          />
        )}

        {currentScreen === 'player' && currentSong && (
          <PlayerScreen
            song={currentSong}
            onToggleFavorite={handleToggleFavorite}
            onRemix={handleRemix}
            onOpenVideoLyrics={(song, version) => setVideoLyricsData({ song, version })}
            onOpenShareTikTok={(song) => setShareTikTokSong(song)}
            onNextSong={handleNextSong}
            onPrevSong={handlePrevSong}
          />
        )}

        {currentScreen === 'library' && (
          <LibraryScreen
            songs={songs}
            currentSongId={currentSong?.id}
            onSelectSong={handleSelectSong}
            onToggleFavorite={handleToggleFavorite}
            onDeleteSong={handleDeleteSong}
            onNavigate={setCurrentScreen}
            onDownloadSong={handleDownloadSong}
          />
        )}

        {currentScreen === 'explore' && (
          <ExploreScreen
            songs={songs}
            onSelectSong={handleSelectSong}
            onRemix={handleRemix}
            onNavigate={setCurrentScreen}
          />
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          // Reset prefill when navigating manually to create
          if (screen === 'create' && currentScreen !== 'create') {
            setPrefillPrompt('');
          }
          setCurrentScreen(screen);
        }}
      />

      {/* Generation Progress Modal */}
      {isGenerating && (
        <GenerationModal
          genre={generationGenre}
          onComplete={handleGenerationModalComplete}
        />
      )}

      {/* Video Lyrics Karaoke Modal */}
      {videoLyricsData && (
        <VideoLyricsModal
          song={videoLyricsData.song}
          version={videoLyricsData.version}
          onClose={() => setVideoLyricsData(null)}
        />
      )}

      {/* Share to TikTok Modal */}
      {shareTikTokSong && (
        <ShareTikTokModal
          song={shareTikTokSong}
          onClose={() => setShareTikTokSong(null)}
        />
      )}

      {/* Credits Recharge Modal */}
      {showCreditsModal && (
        <CreditsModal
          credits={credits}
          onAddCredits={(amount) => setCredits((prev) => prev + amount)}
          onClose={() => setShowCreditsModal(false)}
        />
      )}

      {/* Export / APK Guide Modal */}
      {showApkModal && (
        <ExportApkModal onClose={() => setShowApkModal(false)} />
      )}
    </div>
  );
}
