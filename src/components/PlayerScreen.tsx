import { useState } from 'react';

export default function PlayerScreen() {
  const [prompt, setPrompt] = useState("Aku kangen kampung halaman pas lebaran");
  const [genre, setGenre] = useState("Reggae Gambus Klasik, koplo, dangdut modern");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const generateMusic = async () => {
    setLoading(true);
    setStatus("Lagi bikin lagu dari text lu... 30 detik ya Cang...");
    setSongs([]);

    try {
      // 1. MINTA BIKIN LAGU
      const res = await fetch("https://api.kie.ai/api/v1/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_KIE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: `${prompt}, ${genre}, indonesian vocal, high quality`,
          model: "suno-v4.5",
          make_instrumental: false
        })
      });
      const data = await res.json();
      const taskId = data.data?.taskId || data.taskId;
      
      // 2. TUNGGU JADI (POLLING)
      let tries = 0;
      while (
