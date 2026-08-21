import { useState } from 'react';

export function PlayerScreen() {
  const [prompt, setPrompt] = useState("Aku kangen kampung halaman pas lebaran, rindu ibu");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<{url: string, title: string}[]>([]);
  const [status, setStatus] = useState("Siap - Tulis cerita lu di atas");
  const apiKey = (import.meta as any).env.VITE_KIE_API_KEY;

  const generateMusic = async () => {
    if(!apiKey){ setStatus("❌ API KEY KOSONG!"); return; }
    setLoading(true); setSongs([]);
    setStatus("🚀 Kirim ke Kie AI Suno...");
    try {
      const res = await fetch("https://api.kie.ai/api/v1/generate", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt + ", Dangdut Koplo, Indonesian Male Vocal, melancholic",
          customMode: false,
          instrumental: false,
          model: "V4", // <- pake V4 sesuai docs, bukan suno-v4.5
          callBackUrl: "https://example.com/callback" // <- WAJIB ADA BIAR NGAK 422!
        })
      });
      const data = await res.json();
      const taskId = data.data?.taskId || data.taskId;
      if(!taskId){ setStatus("❌ Gagal bikin task: " + JSON.stringify(data).slice(0,250)); setLoading(false); return; }
      setStatus("✅ Task: " + taskId.slice(0,8) + "... polling...");

      for(let i=0;i<40;i++){
        await new Promise(r=>setTimeout(r,3000));
        setStatus(`🎧 Mixing... ${i*3}s`);
        // ENDPOINT POLLING YANG BENER SESUAI DOCS!
        const check = await fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
          headers: { "Authorization": "Bearer " + apiKey }
        });
        const result = await check.json();
        // state bisa success / fail
        const state = result.data?.state || result.data?.status;
        const response = result.data?.response;
        const sunoData = response?.sunoData || result.data?.response?.sunoData;

        if(state === 'FAIL' || state === 'fail'){ setStatus("❌ Fail: " + JSON.stringify(result).slice(0,250)); break; }
        if(state === 'SUCCESS' && Array.isArray(sunoData) && sunoData[0]?.audioUrl){
          const finalSongs = sunoData.map((s:any)=>({url: s.audioUrl, title: s.title || prompt.slice(0,20)}));
          setSongs(finalSongs);
          const existing = JSON.parse(localStorage.getItem('musika_koleksi')||'[]');
          localStorage.setItem('musika_koleksi', JSON.stringify([...finalSongs.map((x:any)=>({id:Date.now()+Math.random(), title:x.title, url:x.url})),...existing]));
          setStatus(`✅ JADI ${finalSongs.length} LAGU! Cek Koleksiku!`);
          break;
        }
        if(i===39) setStatus("⏰ Timeout 120s - cek https://kie.ai/logs taskId:" + taskId);
      }
    } catch(e:any){ setStatus("❌ Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:16, background:'#FFF8E1', minHeight:'100vh'}}>
      <h2 style={{color:'#000', fontWeight:'bold'}}>FIX 422 + record-info</h2>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} style={{width:'100%', height:110, padding:12, border:'3px solid #000', borderRadius:12, color:'#000', background:'#fff'}}/>
      <button onClick={generateMusic} disabled={loading} style={{width:'100%', marginTop:14, background: loading?'#999':'#FFEB3B', color:'#000', padding:16, borderRadius:14, fontWeight:'900', border:'2px solid #000'}}>
        {loading? "⏳ LAGI BIKIN..." : "Generate Lagu Koplo (2 Versi)"}
      </button>
      <div style={{marginTop:12, background:'#000', color:'#0f0', padding:12, borderRadius:10, fontFamily:'monospace'}}>{status}</div>
      {songs.map((s,i)=>(
        <div key={i} style={{background:'#fff', border:'3px solid #000', padding:12, borderRadius:12, marginTop:12}}>
          <b style={{color:'#000'}}>{s.title}</b><audio controls src={s.url} style={{width:'100%', marginTop:8}}/>
        </div>
      ))}
    </div>
  );
}
export default PlayerScreen;
