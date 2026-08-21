import { Song, SongVersion, LyricLine } from '../types';

const KOPLO_ALBUM_COVERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBH3ZAOQirzrqdP-5njxznWyQb10bhu3TYL5PA4Z4zk90OjUmya1QpwFrNWN15d3fvMDXxZjOHQkzi8tkIY1zP6aIMZDO1eZm6cEn4rpGBmew7g_H5pwxxFXIR8gk9x5gOOLeguRZl00MtnofS9NbE2SW8jpEAYpZZUZnS5Umm7uwPIgjWkePhHWQWpOqRxO-iwMY--9h1fenPiM-whGu3y3kTMWM1V0EtrweXVZA_TC7KFxiNh1dE1JA',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'
];

interface GenerateKoploParams {
  prompt: string;
  genre: string;
  language: string;
  vocalType: 'pria' | 'wanita' | 'duet';
}

export async function generateKoploSong(params: GenerateKoploParams): Promise<Song> {
  const coverUrl = KOPLO_ALBUM_COVERS[Math.floor(Math.random() * KOPLO_ALBUM_COVERS.length)];

  try {
    const res = await fetch('/api/generate-koplo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.title && data.version1) {
        return {
          id: `song-${Date.now()}`,
          title: data.title,
          artist: params.vocalType === 'wanita' ? '@Sinden_AI' : (params.vocalType === 'pria' ? '@Cak_AI' : '@Duet_Nusantara'),
          coverUrl,
          prompt: params.prompt,
          genre: params.genre,
          language: params.language,
          vocalType: params.vocalType,
          createdAt: Date.now(),
          isFavorite: false,
          playCount: 1,
          likesCount: 0,
          activeVersionIndex: 0,
          versions: [
            formatApiVersion(data.version1, 'Versi 1 - Koplo', 138, 'energetic'),
            formatApiVersion(data.version2, 'Versi 2 - Pop Jawa', 106, 'acoustic')
          ]
        };
      }
    }
  } catch (err) {
    console.warn("Using offline smart Koplo generator:", err);
  }

  // Smart Offline Generator with authentic Nusantara lyrics rhyming and cues
  return generateOfflineSmartKoplo(params, coverUrl);
}

function formatApiVersion(
  apiVer: { versionName?: string; genre?: string; bpm?: number; mood?: string; producerNotes?: string; lyrics?: Array<{ time?: number; text?: string; translation?: string; section?: string; cue?: string }> },
  defaultName: string,
  defaultBpm: number,
  tone: 'energetic' | 'acoustic'
): SongVersion {
  const lyrics: LyricLine[] = (apiVer?.lyrics || []).map((l, idx) => ({
    id: `lyric-${idx}`,
    time: l.time ?? idx * 8,
    text: l.text || '♫ [Melodi Nusantara] ♫',
    translation: l.translation || '♫ [Melodi Nusantara] ♫',
    section: (l.section as LyricLine['section']) || 'verse',
    cue: l.cue
  }));

  const bars = Array.from({ length: 36 }, () => Number((0.3 + Math.random() * 0.7).toFixed(2)));

  return {
    id: `v-${Date.now()}-${Math.random()}`,
    versionName: apiVer?.versionName || defaultName,
    genre: apiVer?.genre || (tone === 'energetic' ? 'Dangdut Koplo' : 'Pop Jawa'),
    bpm: apiVer?.bpm || defaultBpm,
    mood: apiVer?.mood || (tone === 'energetic' ? 'Goyang Semangat' : 'Ambyar Melow'),
    audioTone: tone,
    duration: 195,
    durationFormatted: '3:15',
    producerNotes: apiVer?.producerNotes || 'Aransemen kendang tak-tung, brass stab, suling bambu',
    waveformBars: bars,
    lyrics: lyrics.length > 0 ? lyrics : getDefaultLyrics(tone)
  };
}

function getDefaultLyrics(tone: 'energetic' | 'acoustic'): LyricLine[] {
  if (tone === 'energetic') {
    return [
      { id: 'dl1', time: 0, section: 'intro', text: '♫ [Intro Kendang Muter: Tak-Tung-Dut] ♫', translation: '♫ [Intro Kendang Berputar Dangdut Koplo] ♫', cue: 'Tarik Sis! Semongko!' },
      { id: 'dl2', time: 8, section: 'verse', text: 'Rino wengi tansah kelingan esemmu', translation: 'Siang dan malam selalu teringat senyumanmu' },
      { id: 'dl3', time: 16, section: 'verse', text: 'Nanging kowe malah gandeng wong liyo', translation: 'Namun kau malah bergandengan dengan yang lain' },
      { id: 'dl4', time: 26, section: 'chorus', text: 'Ambyar atiku, remuk rasane!', translation: 'Hancur hatiku, remuk rasanya!', cue: 'Hak e Hak e!' },
      { id: 'dl5', time: 36, section: 'chorus', text: 'Tetep tak goyang ben ra ketok nelongso...', translation: 'Tetap kubergoyang agar tak terlihat bersedih...' }
    ];
  }
  return [
    { id: 'dl1b', time: 0, section: 'intro', text: '♫ [Petikan Piano Syahdu & Desir Angin] ♫', translation: '♫ [Alunan Piano Syahdu & Suasana Tenang] ♫' },
    { id: 'dl2b', time: 10, section: 'verse', text: 'Mendung ning langit kutho iki...', translation: 'Mendung di langit kota ini...' },
    { id: 'dl3b', time: 22, section: 'chorus', text: 'Ikhlas atiku nyawang kowe bahagia karo liyane', translation: 'Ikhlas hatiku melihatmu bahagia bersama yang lain' }
  ];
}

function generateOfflineSmartKoplo(params: GenerateKoploParams, coverUrl: string): Song {
  const p = params.prompt.trim();
  const title = generateCatchyTitle(p, params.genre);
  const bars = Array.from({ length: 36 }, () => Number((0.35 + Math.random() * 0.65).toFixed(2)));

  const v1Lyrics: LyricLine[] = [
    { id: 'ol1', time: 0, section: 'intro', text: '♫ [Intro Kendang Jawa Timuran & Brass Synth] ♫', translation: '♫ [Intro Tabuhan Kendang Jawa Timur & Brass Synthesizer] ♫', cue: 'Tarik Sis! Semongko!' },
    { id: 'ol2', time: 8, section: 'verse', text: `Awale crito: ${p.slice(0, 45)}...`, translation: `Awal mula cerita: ${p.slice(0, 45)}...` },
    { id: 'ol3', time: 16, section: 'verse', text: 'Kabeh kenangan wes tak simpen ning dodo', translation: 'Semua kenangan sudah kusimpan rapat di dalam dada' },
    { id: 'ol4', time: 24, section: 'pre-chorus', text: 'Senajan perih, tetep mesem ning ngarepmu', translation: 'Walaupun perih, tetap tersenyum di hadapanmu', cue: 'Hak e Hak e! Joss!' },
    { id: 'ol5', time: 34, section: 'chorus', text: `${title} - Kabeh wes dadi takdir Ilahi`, translation: `${title} - Semua sudah menjadi ketetapan Yang Maha Kuasa` },
    { id: 'ol6', time: 44, section: 'chorus', text: 'Ora usah nangis, ayo digoyang koplo wae!', translation: 'Janganlah menangis, mari kita goyang koplo saja!' },
    { id: 'ol7', time: 56, section: 'kendang-drop', text: '♫ [Solo Kendang Muter & Suling Bambu] Buka Titik Joss! ♫', translation: '♫ [Solo Kendang & Suling Bambu] ♫', cue: 'Buka Titik Joss!' },
    { id: 'ol8', time: 68, section: 'outro', text: 'Mugo-mugo sliramu tansah pinaringan bungah...', translation: 'Semoga dirimu selalu dilimpahi kebahagiaan...' }
  ];

  const v2Lyrics: LyricLine[] = [
    { id: 'ol1b', time: 0, section: 'intro', text: '♫ [Petikan Gitar Akustik & Cello Malam] ♫', translation: '♫ [Petikan Gitar Akustik & Alunan Cello Malam] ♫' },
    { id: 'ol2b', time: 10, section: 'verse', text: 'Udan grimis nelesi dalan sepi', translation: 'Hujan gerimis membasahi jalanan sunyi' },
    { id: 'ol3b', time: 20, section: 'verse', text: `Eling sliramu: "${p.slice(0, 40)}"`, translation: `Mengingat dirimu: "${p.slice(0, 40)}"` },
    { id: 'ol4b', time: 32, section: 'chorus', text: `${title} - Tatu iki bakal dadi crito abadi`, translation: `${title} - Luka ini kan menjadi kisah abadi` },
    { id: 'ol5b', time: 46, section: 'outro', text: 'Maturnuwun wes tau dadi pelangi ning uripku...', translation: 'Terima kasih telah sempat menjadi pelangi dalam hidupku...' }
  ];

  return {
    id: `song-${Date.now()}`,
    title,
    artist: params.vocalType === 'wanita' ? '@SindenKoplo_AI' : (params.vocalType === 'pria' ? '@CakPercil_AI' : '@DuetNusantara_AI'),
    coverUrl,
    prompt: params.prompt,
    genre: params.genre,
    language: params.language,
    vocalType: params.vocalType,
    createdAt: Date.now(),
    isFavorite: false,
    playCount: 1,
    likesCount: 0,
    activeVersionIndex: 0,
    versions: [
      {
        id: 'v1',
        versionName: `Versi 1 - ${params.genre.includes('Koplo') ? 'Koplo Horeg' : params.genre}`,
        genre: params.genre,
        bpm: 138,
        mood: 'Goyang Energik',
        audioTone: 'energetic',
        duration: 195,
        durationFormatted: '3:15',
        producerNotes: 'Ketukan Kendang Tak-Tung Jawa Timuran, Brass stab agresif, Drop horeg di menit 0:56',
        waveformBars: bars,
        lyrics: v1Lyrics
      },
      {
        id: 'v2',
        versionName: 'Versi 2 - Pop Jawa Ambyar',
        genre: 'Pop Jawa (Ambyar)',
        bpm: 106,
        mood: 'Melow Menyayat Hati',
        audioTone: 'acoustic',
        duration: 210,
        durationFormatted: '3:30',
        producerNotes: 'Aransemen Grand Piano, Cello akustik, dan gitar nilon syahdu',
        waveformBars: bars.map(b => Number((b * 0.8).toFixed(2))),
        lyrics: v2Lyrics
      }
    ]
  };
}

function generateCatchyTitle(prompt: string, genre: string): string {
  const pLower = prompt.toLowerCase();
  if (pLower.includes('rabi') || pLower.includes('nikah')) return 'Ditinggal Rabi Pas Sayang Sayange';
  if (pLower.includes('kopi') || pLower.includes('nongkrong')) return 'Kopi Pahit Janji Manis';
  if (pLower.includes('utang') || pLower.includes('duit') || pLower.includes('cilok')) return 'Pejuang Rupiah Pantang Sambat';
  if (pLower.includes('mantan') || pLower.includes('reuni')) return 'Ketemu Mantan Ning Malioboro';
  if (pLower.includes('selingkuh') || pLower.includes('ketikung')) return 'Bojoku Ketikung Bestie';
  if (pLower.includes('tresno') || pLower.includes('cinta')) return 'Tresno Tekaning Pati';

  const keywords = prompt.split(' ').slice(0, 4).join(' ');
  const capitalized = keywords.charAt(0).toUpperCase() + keywords.slice(1);
  return `${capitalized} (${genre.includes('Koplo') ? 'Koplo Version' : 'Nusantara Edit'})`;
}
