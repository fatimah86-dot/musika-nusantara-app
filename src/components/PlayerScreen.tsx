import { useState } from 'react';

export function PlayerScreen() {
  const [prompt, setPrompt] = useState("Aku kangen kampung halaman pas lebaran, rindu ibu");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<{url: string, title: string}[]>([]);
  const [status, setStatus] = useState("Siap - Tulis cerita lu di atas");
  const apiKey = (import.meta as any).env.VITE_KIE_API_KEY;

  const generateMusic = async () => {
    if(!apiKey){ setStatus("❌ API KEY KOSONG! Cek di GitHub Secrets!"); return; }
    setLoading(true); setSongs([]); setStatus("🚀 Kirim ke Kie AI...");
    try {
      const res = await fetch("https://api.kie.ai/api/v1/generate", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt + " , Reggae Gambus Koplo, Indonesian Male Vocal, melancholic",
          model: "suno",
          customMode: false
        })
      });
      const data = await res.json();
      const taskId = data.data?.taskId || data.taskId;
      if(!taskId){ setStatus("❌ Gagal bikin task: " + JSON.stringify(data).slice(0,200)); setLoading(false); return; }
      setStatus("✅ Task ID: " + taskId.slice(0,8) + "... tunggu 60 detik...");

      for(let i=0;i<40;i++){
        await new Promise(r=>setTimeout(r,3000));
        setStatus(`🎧 Mixing... ${i*3}s - Task: ${taskId.slice(0,6)}`);
        const check = await fetch(`https://api.kie.ai/api/v1/generate/${taskId}`, {
          headers: { "Authorization": "Bearer " + apiKey }
        });
        const result = await check.json();
        // Kie AI format bisa beda-beda, kita cek semua
        const state = result.data?.state || result.data?.status;
        const maybeSongs = result.data?.response?.sunoData || result.data?.songs || result.data;
        
        if(state === 'FAIL' || state === 'FAILED'){ setStatus("❌ Gagal generate: " + JSON.stringify(result).slice(0,200)); break; }

        if(Array.isArray(maybeSongs) && maybeSongs.length>0 && maybeSongs[0]?.audioUrl){
           setSongs(maybeSongs.map((s:any)=>({url: s.audioUrl || s.audio_url || s.url, title: s.title || "Lagu Buatan AI"})));
           setStatus(`✅ JADI ${maybeSongs.length} LAGU! Kredit kepotong!`);
           break;
        }
        if(i===39) setStatus("⏰ Timeout 120s - Cek di kie.ai dashboard, taskId: " + taskId);
      }
    } catch(e:any){ setStatus("❌ Error koneksi: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:16, background:'#FFF8E1', minHeight:'100vh'}}>
      <h2 style={{color:'#000', fontWeight:'bold'}}>Musika Nusantara - Final Fix</h2>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} style={{width:'100%', height:110, padding:12, border:'3px solid #000', borderRadius:12, color:'#000', background:'#fff', fontSize:16, marginTop:10}}/>
      <button onClick={generateMusic} disabled={loading} style={{width:'100%', marginTop:14, background: loading?'#999':'#FFEB3B', color:'#000', padding:16, borderRadius:14, fontWeight:'900', fontSize:16, border:'2px solid #000'}}>
        {loading? "⏳ LAGI BIKIN..." : "Generate Lagu Koplo (2 Versi)"}
      </button>
      <div style={{marginTop:12, background:'#000', color:'#0f0', padding:12, borderRadius:10, fontFamily:'monospace', fontSize:13, minHeight:40}}>{status}</div>
      {songs.map((s,i)=>(
        <div key={i} style={{background:'#fff', border:'3px solid #000', padding:12, borderRadius:12, marginTop:12}}>
          <b style={{color:'#000'}}>Versi {i+1}: {s.title}</b>
          <audio controls src={s.url} style={{width:'100%', marginTop:8}}/>
          <a href={s.url} target="_blank" style={{color:'blue', fontWeight:'bold'}}>⬇️ Download MP3</a>
        </div>
      ))}
    </div>
  );
}
export default PlayerScreen;
