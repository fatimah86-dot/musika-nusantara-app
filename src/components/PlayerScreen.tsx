import { useState } from 'react';

export function PlayerScreen() {
  const [prompt, setPrompt] = useState("Aku kangen kampung halaman pas lebaran");
  const [genre] = useState("Reggae Gambus Klasik, koplo");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<{url: string, title: string}[]>([]);
  const [status, setStatus] = useState("");
  const apiKey = (import.meta as any).env.VITE_KIE_API_KEY;

  const generateMusic = async () => {
    if(!apiKey){ setStatus("API Key belum kebaca! Cek VITE_KIE_API_KEY di main.yml"); return; }
    setLoading(true);
    setStatus("Lagi bikin lagu dari text lu...");
    setSongs([]);
    try {
      const res = await fetch("https://api.kie.ai/api/v1/generate", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt + ", " + genre, model: "suno-v4.5" })
      });
      const data = await res.json();
      const taskId = data.data?.taskId || data.taskId;
      let tries = 0;
      while (tries < 30) {
        await new Promise(r => setTimeout(r, 4000));
        const check = await fetch("https://api.kie.ai/api/v1/generate/" + taskId, {
          headers: { "Authorization": "Bearer " + apiKey }
        });
        const result = await check.json();
        const list = result.data?.songs || result.data;
        if (Array.isArray(list) && list.length > 0) {
          setSongs(list.map((s:any)=>({url: s.audioUrl || s.url, title: s.title || "Lagu Koplo"})));
          setStatus("Jadi!"); break;
        }
        setStatus("Mixing... " + tries*4 + "s"); tries++;
      }
    } catch (e:any) { setStatus("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:16, background:'#FFF8E1', minHeight:'100vh'}}>
      <h1 style={{fontSize:20, fontWeight:'bold'}}>Musika Nusantara - Text to Music</h1>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} style={{width:'100%', padding:12, border:'2px solid #ccc', borderRadius:12, height:100, marginTop:12}} />
      <button onClick={generateMusic} disabled={loading} style={{width:'100%', marginTop:16, background: loading?'#ccc':'#FFEB3B', padding:16, borderRadius:12, fontWeight:'bold'}}>
        {loading? "Lagi Bikin..." : "Generate Lagu Koplo (2 Versi)"}
      </button>
      <p style={{marginTop:12, textAlign:'center'}}>{status}</p>
      {songs.map((s,i)=>(
        <div key={i} style={{background:'#fff', padding:12, borderRadius:12, marginTop:12}}>
          <p style={{fontWeight:'bold'}}>Versi {i+1}: {s.title}</p>
          <audio controls src={s.url} style={{width:'100%', marginTop:8}} />
        </div>
      ))}
    </div>
  );
}

export default PlayerScreen;
