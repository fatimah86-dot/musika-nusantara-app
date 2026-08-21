import { useRef, useState } from 'react';

const TRACKS = [
  { id: 1, title: "Ditinggal Pas Sayang Sayange V1", file: "/music/lagu1.mp3", artist: "Sinden Koplo AI", lirik: "Pas wingi kowe mblenjani janji..." },
  { id: 2, title: "Ditinggal Pas Sayang Sayange V2", file: "/music/lagu2.mp3", artist: "Sinden Koplo AI", lirik: "Pas wingi kowe mblenjani janji..." },
];

export default function PlayerScreen() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div className="p-4 bg-gradient-to-b from-purple-900 to-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-2 text-yellow-300">Musika Nusantara</h1>
      <p className="mb-4">{TRACKS[current].title} - {TRACKS[current].artist}</p>

      <audio ref={audioRef} src={TRACKS[current].file} onEnded={() => setIsPlaying(false)} controls className="w-full mb-4" />

      <button onClick={playPause} className="w-full py-4 rounded-full bg-yellow-400 text-black font-bold text-lg mb-4">
        {isPlaying? "⏸️ Pause Sis!" : "▶️ Tarik Sis! Hak e Hak e!"}
      </button>

      <div className="flex gap-2">
        <button onClick={() => setCurrent((current-1+TRACKS.length)%TRACKS.length)} className="flex-1 py-2 bg-white/20 rounded">Prev</button>
        <button onClick={() => setCurrent((current+1)%TRACKS.length)} className="flex-1 py-2 bg-white/20 rounded">Next</button>
      </div>

      <div className="mt-6 p-3 bg-white/10 rounded">
        <p className="text-sm whitespace-pre-line">{TRACKS[current].lirik}</p>
      </div>
    </div>
  );
}
