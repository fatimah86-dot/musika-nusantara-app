import { useRef, useState } from 'react';

export const PlayerScreen = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState(0);

  const tracks = [
    { title: "Ditinggal Pas Sayang Sayange V1", file: "/music/lagu1.mp3" },
    { title: "Ditinggal Pas Sayang Sayange V2", file: "/music/lagu2.mp3" },
  ];

  // kalau nama file kamu masih panjang dari suno, ganti jadi nama aslinya ya!
  // contoh: "/music/Ditinggal%20Pas%20Sayang%20-%20Suno.mp3"

  const toggle = () => {
    if(!audioRef.current) return;
    if(isPlaying){ audioRef.current.pause(); setIsPlaying(false); }
    else{ audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div style={{padding:24, background:'linear-gradient(to bottom, #4a1a6b, #000)', minHeight:'100vh', color:'white'}}>
      <h2 style={{fontWeight:'bold', fontSize:20, color:'#facc15'}}>{tracks[track].title}</h2>
      <audio ref={audioRef} src={tracks[track].file} controls style={{width:'100%', marginTop:16}} onEnded={()=>setIsPlaying(false)} />
      <button onClick={toggle} style={{marginTop:16, width:'100%', padding:16, borderRadius:999, background:'#facc15', color:'black', fontWeight:'bold', fontSize:18}}>
        {isPlaying? "⏸️ Pause" : "▶️ Tarik Sis! Hak e Hak e!"}
      </button>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button onClick={()=>setTrack((track-1+tracks.length)%tracks.length)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.2)', borderRadius:12}}>Prev</button>
        <button onClick={()=>setTrack((track+1)%tracks.length)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.2)', borderRadius:12}}>Next</button>
      </div>
      <p style={{marginTop:20, opacity:0.7, fontSize:12}}>File ada di: {tracks[track].file} - kalau gagal muter, cek nama file di public/music ya!</p>
    </div>
  );
};
