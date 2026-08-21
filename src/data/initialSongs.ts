import { Song, GenreOption, LanguageOption } from '../types';

export const GENRE_OPTIONS: GenreOption[] = [
  {
    id: 'koplo',
    name: 'Dangdut Koplo',
    desc: 'Ketukan kendang cepat, energik, & bikin goyang',
    icon: 'graphic_eq',
    color: '#FFD700',
    defaultBpm: 138,
    tags: ['Kendang Tak-Tung', '138 BPM', 'Viral TikTok']
  },
  {
    id: 'pop-jawa',
    name: 'Pop Jawa (Ambyar)',
    desc: 'Melodi piano syahdu, lirik menyayat hati khas Didi Kempot style',
    icon: 'favorite',
    color: '#DCB8FF',
    defaultBpm: 105,
    tags: ['Ambyar', 'Akustik Melow', 'Patah Hati']
  },
  {
    id: 'campursari',
    name: 'Campursari Modern',
    desc: 'Perpaduan gamelan laras pelog-slendro dengan aransemen modern',
    icon: 'music_note',
    color: '#00E479',
    defaultBpm: 120,
    tags: ['Gamelan Saron', 'Gong & Kendang', 'Klasik']
  },
  {
    id: 'koplo-edm',
    name: 'Koplo EDM / Horeg',
    desc: 'Sub-bass gler menggelegar dipadu kendang muter sound system',
    icon: 'bolt',
    color: '#FF3B30',
    defaultBpm: 145,
    tags: ['Glerr Horeg', 'Sub-Bass 30Hz', 'Festival Sound']
  },
  {
    id: 'reggae-jawa',
    name: 'Reggae Jawa Santuy',
    desc: 'Irama up-beat santai dengan kendang tipis & brass hangat',
    icon: 'spa',
    color: '#FFE16D',
    defaultBpm: 110,
    tags: ['Santuy', 'Pantai', 'Kopi Senja']
  },
  {
    id: 'funkot-nusantara',
    name: 'Funkot Nusantara',
    desc: 'Ketukan funky kota dengan sampling vokal khas Nusantara',
    icon: 'celebration',
    color: '#00D2FF',
    defaultBpm: 155,
    tags: ['Fast Tempo', 'Club Koplo', 'Bassline']
  }
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'jawa-ngoko', name: 'Jawa Ngoko', sub: 'Santai, gaul, akrab (Solo / Jogja / Jatim)', badge: 'Paling Populer' },
  { id: 'indonesia', name: 'Bahasa Indonesia', sub: 'Universal, mudah dipahami se-Indonesia', badge: 'Nasional' },
  { id: 'jawa-krama', name: 'Jawa Krama Inggil', sub: 'Halus, puitis, sastra tembang', badge: 'Puitis' },
  { id: 'sunda', name: 'Bahasa Sunda', sub: 'Khas Priangan Jaipong & Pop Sunda', badge: 'Khas' }
];

export const INSPIRATION_PROMPTS = [
  "Ditinggal rabi pas lagi sayang-sayange, padahal wes nabung tuku ali-ali",
  "Kisah pejuang rupiah bakul cilok keliling sing ora kenal lelah demi restu calon mertua",
  "Ketemu mantan pacar pas reuni SMP ning Alun-Alun Kidul, jebul wonge wes gandeng liyane",
  "Nongkrong warung kopi esuk-esuk ngrembug nasib karo konco kenthel",
  "Kangen kampung halaman ning lereng Gunung Lawu pas wayah panen pari",
  "Cinta kilat kepincut sinden ayu ning hajatan tanggap wayang"
];

export const INITIAL_SONGS: Song[] = [
  {
    id: 'song-1',
    title: 'Ditinggal Pas Sayang Sayange',
    artist: '@AI_Studio',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH3ZAOQirzrqdP-5njxznWyQb10bhu3TYL5PA4Z4zk90OjUmya1QpwFrNWN15d3fvMDXxZjOHQkzi8tkIY1zP6aIMZDO1eZm6cEn4rpGBmew7g_H5pwxxFXIR8gk9x5gOOLeguRZl00MtnofS9NbE2SW8jpEAYpZZUZnS5Umm7uwPIgjWkePhHWQWpOqRxO-iwMY--9h1fenPiM-whGu3y3kTMWM1V0EtrweXVZA_TC7KFxiNh1dE1JA',
    prompt: 'Lagu patah hati karena pacar mendadak pergi saat cinta sedang mekar-mekarnya, aransemen koplo asik tapi lirik bikin ambyar',
    genre: 'Dangdut Koplo',
    language: 'Jawa Ngoko',
    vocalType: 'wanita',
    createdAt: Date.now() - 3600000 * 2,
    isFavorite: true,
    playCount: 14200,
    likesCount: 3890,
    activeVersionIndex: 0,
    versions: [
      {
        id: 'v1',
        versionName: 'Versi 1 - Koplo',
        genre: 'Dangdut Koplo',
        bpm: 138,
        mood: 'Goyang Pedih',
        audioTone: 'energetic',
        duration: 195,
        durationFormatted: '3:15',
        producerNotes: 'Ketukan Kendang Tak-Tung Jawa Timuran, Brass sintetis agresif, drop kendang di menit 0:45',
        waveformBars: [0.35, 0.6, 0.85, 0.45, 0.95, 0.7, 0.5, 0.8, 0.65, 0.9, 0.4, 0.75, 0.85, 0.95, 0.6, 0.4, 0.8, 0.9, 0.7, 0.55, 0.85, 0.65, 0.4, 0.9, 0.75, 0.5, 0.8, 0.6, 0.35, 0.85, 0.95, 0.7, 0.45, 0.6, 0.8, 0.5],
        lyrics: [
          { id: 'l1', time: 0, section: 'intro', text: '♫ [Intro Kendang Muter: Tak-Tung-Tak-Dut] ♫', translation: '♫ [Intro Gendang Berputar Irama Koplo] ♫', cue: 'Tarik Sis! Semongko!' },
          { id: 'l2', time: 8, section: 'verse', text: 'Pas wingi kowe mblenjani janji', translation: 'Kemarin kau mengingkari janjimu' },
          { id: 'l3', time: 16, section: 'verse', text: 'Kandhamu tresno tekaning pati', translation: 'Katamu cintamu sampai mati' },
          { id: 'l4', time: 24, section: 'pre-chorus', text: 'Nanging nyatane kowe malah mlayu', translation: 'Namun kenyataannya kau malah lari' },
          { id: 'l5', time: 32, section: 'pre-chorus', text: 'Ninggalake tatu ning njero dadaku', translation: 'Meninggalkan luka perih di dalam dadaku', cue: 'Hak e Hak e! Joss!' },
          { id: 'l6', time: 42, section: 'chorus', text: 'Ditinggal pas sayang sayange', translation: 'Ditinggal saat sayang-sayangnya' },
          { id: 'l7', time: 52, section: 'chorus', text: 'Loro rasane ati iki', translation: 'Sakit sekali rasanya hati ini' },
          { id: 'l8', time: 62, section: 'chorus', text: 'Nanging aku ra popo, tak ikhlasne kowe...', translation: 'Tapi aku tidak apa-apa, ku ikhlaskan dirimu...' },
          { id: 'l9', time: 74, section: 'kendang-drop', text: '♫ [Solo Suling & Kendang Horeg] Buka Titik Joss! ♫', translation: '♫ [Solo Seruling & Tabuhan Kendang Bergoyang] ♫', cue: 'Buka Titik Joss!' },
          { id: 'l10', time: 86, section: 'verse', text: 'Mugo kowe nemu kabagyan anyar', translation: 'Semoga kau menemukan kebahagiaan baru' },
          { id: 'l11', time: 96, section: 'outro', text: 'Senajan ati iki ajur mumur...', translation: 'Meskipun hati ini hancur berkeping-keping...' }
        ]
      },
      {
        id: 'v2',
        versionName: 'Versi 2 - Pop Jawa',
        genre: 'Pop Jawa (Ambyar)',
        bpm: 104,
        mood: 'Syahdu Menangis',
        audioTone: 'acoustic',
        duration: 210,
        durationFormatted: '3:30',
        producerNotes: 'Aransemen Grand Piano, Cello akustik, dan petikan gitar nilon melankolis',
        waveformBars: [0.2, 0.35, 0.45, 0.3, 0.5, 0.4, 0.6, 0.55, 0.7, 0.65, 0.5, 0.6, 0.75, 0.8, 0.6, 0.5, 0.65, 0.7, 0.55, 0.45, 0.6, 0.5, 0.35, 0.7, 0.6, 0.4, 0.55, 0.5, 0.3, 0.65, 0.75, 0.5, 0.35, 0.4, 0.55, 0.3],
        lyrics: [
          { id: 'l1b', time: 0, section: 'intro', text: '♫ [Petikan Gitar Akustik & Suara Angin Malam] ♫', translation: '♫ [Petikan Gitar Akustik Suasana Malam Syahdu] ♫' },
          { id: 'l2b', time: 10, section: 'verse', text: 'Pas wingi kowe mblenjani janji suci', translation: 'Kemarin kau ingkari janji suci itu' },
          { id: 'l3b', time: 20, section: 'verse', text: 'Kandhamu aku iki siji-sijine', translation: 'Katamu aku satu-satunya di hatimu' },
          { id: 'l4b', time: 32, section: 'chorus', text: 'Ditinggal pas sayang sayange...', translation: 'Ditinggal tepat saat rasa sayang memuncak...' },
          { id: 'l5b', time: 45, section: 'chorus', text: 'Netes banyu moto iki nelesi pipi', translation: 'Menetes air mata ini membasahi pipi' },
          { id: 'l6b', time: 60, section: 'outro', text: 'Ikhlas lair batin tak culne sliramu...', translation: 'Ikhlas lahir batin kulepaskan dirimu...' }
        ]
      }
    ]
  },
  {
    id: 'song-2',
    title: 'Kopi Ireng Janji Manis',
    artist: '@Cak_AI',
    coverUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
    prompt: 'Lagu nongkrong angkringan malam hari, janji manis waktu pacaran yang cuma manis di awal seperti gula kopi saset',
    genre: 'Campursari Modern',
    language: 'Jawa Ngoko',
    vocalType: 'pria',
    createdAt: Date.now() - 3600000 * 8,
    isFavorite: false,
    playCount: 8930,
    likesCount: 2150,
    activeVersionIndex: 0,
    versions: [
      {
        id: 'v2-1',
        versionName: 'Versi 1 - Campursari',
        genre: 'Campursari Modern',
        bpm: 124,
        mood: 'Santuy Guyon',
        audioTone: 'energetic',
        duration: 180,
        durationFormatted: '3:00',
        producerNotes: 'Saron gamelan pelog dipadu bassline slap koplo',
        waveformBars: [0.4, 0.7, 0.5, 0.8, 0.65, 0.9, 0.7, 0.85, 0.6, 0.75, 0.9, 0.5, 0.8, 0.7, 0.85, 0.6, 0.45, 0.9, 0.75, 0.6, 0.8, 0.7, 0.5, 0.85, 0.9, 0.65, 0.4, 0.75, 0.85, 0.6, 0.4, 0.7, 0.55, 0.4, 0.6, 0.35],
        lyrics: [
          { id: 'l2-1', time: 0, section: 'intro', text: '♫ [Gong Gamelan & Slap Bass] ♫', translation: '♫ [Irama Gamelan & Bass Slap] ♫', cue: 'Cendol Dawet!' },
          { id: 'l2-2', time: 8, section: 'verse', text: 'Nyruput kopi ireng ning pinggir dalan', translation: 'Menyeruput kopi hitam di pinggir jalan' },
          { id: 'l2-3', time: 16, section: 'verse', text: 'Nglirik sliramu sing maune perhatian', translation: 'Mengingat dirimu yang dulunya perhatian' },
          { id: 'l2-4', time: 26, section: 'chorus', text: 'Janji manismu koyo legine gula batu', translation: 'Janji manismu manis seperti gula batu' },
          { id: 'l2-5', time: 36, section: 'chorus', text: 'Jebul saiki pait koyo ampas kopi tubruk!', translation: 'Ternyata sekarang pahit bagai ampas kopi tubruk!' }
        ]
      },
      {
        id: 'v2-2',
        versionName: 'Versi 2 - Koplo Horeg',
        genre: 'Koplo EDM',
        bpm: 144,
        mood: 'Glerr Menggelegar',
        audioTone: 'horeg',
        duration: 175,
        durationFormatted: '2:55',
        producerNotes: 'Bass Horeg 35Hz sound system horeg Jawa Timur',
        waveformBars: [0.5, 0.9, 0.8, 0.95, 0.85, 1.0, 0.9, 0.95, 0.75, 0.85, 0.9, 0.7, 0.95, 0.85, 0.9, 0.8, 0.6, 0.95, 0.9, 0.8, 0.9, 0.85, 0.7, 0.95, 0.9, 0.8, 0.6, 0.9, 0.95, 0.8, 0.5, 0.85, 0.7, 0.5, 0.75, 0.4],
        lyrics: [
          { id: 'l2-2a', time: 0, section: 'intro', text: '♫ [Sub Bass Horeg Glerrr!] ♫', translation: '♫ [Dentuman Sub Bass Horeg Sound System] ♫', cue: 'Sound Horeg Malang Merapat!' },
          { id: 'l2-2b', time: 10, section: 'chorus', text: 'Janji manismu ambyar ning wedang kopi!', translation: 'Janji manismu ambyar di air kopi!' }
        ]
      }
    ]
  },
  {
    id: 'song-3',
    title: 'Lali Konco Ning Malioboro',
    artist: '@JogjaBeat_AI',
    coverUrl: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?q=80&w=800&auto=format&fit=crop',
    prompt: 'Kisah reuni kawan lama di Malioboro Yogya, kenangan makan gudeg dan jalan santai waktu zaman kuliah',
    genre: 'Pop Jawa (Ambyar)',
    language: 'Jawa Ngoko',
    vocalType: 'duet',
    createdAt: Date.now() - 3600000 * 24,
    isFavorite: true,
    playCount: 11400,
    likesCount: 2980,
    activeVersionIndex: 0,
    versions: [
      {
        id: 'v3-1',
        versionName: 'Versi 1 - Pop Akustik',
        genre: 'Pop Jawa (Ambyar)',
        bpm: 112,
        mood: 'Nostalgia Hangat',
        audioTone: 'acoustic',
        duration: 200,
        durationFormatted: '3:20',
        producerNotes: 'Gitar akustik warm & tiupan flute merdu',
        waveformBars: [0.3, 0.5, 0.65, 0.45, 0.7, 0.55, 0.8, 0.6, 0.75, 0.65, 0.5, 0.7, 0.85, 0.7, 0.6, 0.5, 0.7, 0.8, 0.6, 0.45, 0.7, 0.55, 0.4, 0.75, 0.65, 0.5, 0.6, 0.5, 0.35, 0.7, 0.8, 0.55, 0.4, 0.5, 0.6, 0.3],
        lyrics: [
          { id: 'l3-1', time: 0, section: 'intro', text: '♫ [Suara Angklung Malioboro & Petikan Gitar] ♫', translation: '♫ [Suara Angklung Malioboro & Petikan Gitar] ♫' },
          { id: 'l3-2', time: 10, section: 'verse', text: 'Mlaku-mlaku ning Malioboro wayah wengi', translation: 'Berjalan-jalan di Malioboro saat malam tiba' },
          { id: 'l3-3', time: 20, section: 'verse', text: 'Eling jaman mbiyen numpak pit onthel', translation: 'Teringat masa lalu naik sepeda ontel bersama' },
          { id: 'l3-4', time: 32, section: 'chorus', text: 'Jogja ora tau lali, kenangan iki abadi...', translation: 'Jogja tak pernah lupa, kenangan ini abadi...' }
        ]
      },
      {
        id: 'v3-2',
        versionName: 'Versi 2 - Reggae Jawa',
        genre: 'Reggae Jawa Santuy',
        bpm: 115,
        mood: 'Santuy Banget',
        audioTone: 'energetic',
        duration: 190,
        durationFormatted: '3:10',
        producerNotes: 'Rhythm reggae skank santai dengan kendang tipis',
        waveformBars: [0.4, 0.6, 0.5, 0.7, 0.6, 0.8, 0.65, 0.75, 0.6, 0.8, 0.7, 0.55, 0.75, 0.8, 0.6, 0.5, 0.7, 0.75, 0.6, 0.5, 0.65, 0.6, 0.45, 0.8, 0.7, 0.5, 0.65, 0.55, 0.4, 0.7, 0.75, 0.6, 0.4, 0.55, 0.6, 0.35],
        lyrics: [
          { id: 'l3-2a', time: 0, section: 'intro', text: '♫ [Skank Reggae & Kendang Santai] ♫', translation: '♫ [Irama Reggae Santai & Kendang] ♫', cue: 'Santuy Lur!' },
          { id: 'l3-2b', time: 12, section: 'verse', text: 'Ayo podo ngumpul, ngopi bareng maneh!', translation: 'Ayo kita kumpul, ngopi bersama lagi!' }
        ]
      }
    ]
  }
];
