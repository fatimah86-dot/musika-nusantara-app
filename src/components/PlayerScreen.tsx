export default function PlayerScreen() {
  return (
    <div style={{padding:20}}>
      <h1>Musika Nusantara - Text to Music</h1>
      <p>Text to music aktif. API Key: {String((import.meta as any).env.VITE_KIE_API_KEY || "").substring(0,5)}...</p>
      <textarea id="prompt" style={{width:'100%', height:100, border:'1px solid #ccc'}} defaultValue="kangen kampung halaman"></textarea>
      <button onClick={async ()=>{
        const key = (import.meta as any).env.VITE_KIE_API_KEY;
        const prompt = (document.getElementById('prompt') as any).value;
        alert('Akan generate: ' + prompt + ' dengan key ' + (key?'ada':'tidak ada'));
      }} style={{width:'100%', padding:12, background:'#FFEB3B', marginTop:10}}>Test Generate</button>
    </div>
  )
}
