export default function PlayerScreen() {
  return (
    <div style={{padding:20, color:'white', background:'#111', minHeight:'100vh'}}>
      <h1>Ditinggal Pas Sayang Sayange</h1>
      <audio controls autoPlay style={{width:'100%', marginTop:20}}>
        <source src="/music/lagu1.mp3" type="audio/mpeg" />
      </audio>
      <br/>
      <audio controls style={{width:'100%', marginTop:20}}>
        <source src="/music/lagu2.mp3" type="audio/mpeg" />
      </audio>
      <p style={{marginTop:20}}>Kalau tombol play di atas di-klik harusnya keluar vocal sinden Cang!</p>
    </div>
  )
}
