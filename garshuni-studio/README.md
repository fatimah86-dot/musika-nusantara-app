# Garshuni Studio — Arena Edition

Aplikasi web untuk **membaca kitab gundul**: mengharokati otomatis, melatinkan mengikuti
**3 hukum washal pengucapan**, menerjemahkan ke Bahasa Indonesia, dan **syarah** (penjelasan
makna, i'rab ringkas, kaidah nahwu/sharaf).

## Fitur

| Fitur | Offline (tanpa API key) | Dengan API key Gemini |
|---|---|---|
| **Harokat otomatis** | Kamus harokat lokal (cakupan dilaporkan jujur) | Harokat penuh seluruh naskah |
| **Latin Washal** | ✅ Mesin transliterasi 3 hukum (selalu lokal) | sama |
| **Terjemahan Indonesia** | Hanya teks contoh bawaan (tidak mengarang) | Bebas untuk teks apa pun |
| **Syarah** | Arti per kata dari kamus mufradat (~100 kosakata kitab) | Makna, i'rab ringkas, kaidah nahwu/sharaf per kalimat |
| **Ekstraksi foto kitab** | — | Gemini Vision → teks gundul bersih |
| **Dokumen** | TXT langsung; DOCX & PDF via pustaka saat dipakai | sama |

### 3 Hukum Washal Pengucapan (dipakai mesin Latin)
1. **Ta Marbuthah (ة)** — dibaca "t" saat washal (sambung), "h" saat waqaf (berhenti).
2. **Hamzatul Washl (ا di awal kata)** — gugur saat menyambung (`عَلَى ابْنِهِ` → *‘alaa-bnihi*),
   dibaca "i" saat memulai kalimat (`اِبْنُ` → *ibnu*).
3. **Idgham Al-Lam (ال)** — 14 huruf syamsiyah melebur (`الشَّمْسُ` → *asy-syamsu*),
   qamariyah tetap `al-`; tanwin bersambung ke artikel (`فَصْلٌ الْإِسْلَامِ` → *fashlul-islaami*).

Ada tombol **mode Washal / Waqaf** — mode waqaf menerapkan aturan berhenti (ة→h, tanwin
digugurkan) hanya di akhir kalimat.

## Cara pakai
1. **Paling mudah:** buka `index.html` langsung (satu berkas mandiri — bisa dobel-klik dari
   File Manager HP; tanpa server, tanpa framework dari internet).
2. Atau lewat server statis: `python3 -m http.server 8080` lalu buka `http://localhost:8080`.
3. Tempelkan teks kitab gundul (atau **Unggah** TXT/DOCX/PDF/foto) → **Proses Semua**.
4. Untuk fitur AI penuh: **Konfigurasi API** → isi `GEMINI_API_KEY` dari
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Uji Koneksi** → **Simpan**.

## Berkas
- `index.html` — **aplikasi lengkap dalam satu berkas** (CSS + mesin + aplikasi inline; tanpa
  React/Babel/Tailwind dari CDN — penyebab halaman kosong pada versi sebelumnya).
- `engine.js` — NaskahEngine: sumber resmi mesin (UMD, dipakai `index.html` dan uji Node).
- `uji-engine.js` — 64 unit test mesin: `node uji-engine.js`.
- `README.md` — berkas ini.

> `index.html` memuat salinan `engine.js` di dalamnya. Setelah mengubah `engine.js`,
> jalankan untuk menanamkan ulang:
> ```bash
> python3 - <<'EOF'
> import re
> html = open('index.html', encoding='utf-8').read()
> engine = open('engine.js', encoding='utf-8').read()
> m = re.search(r'(<!-- ====== MESIN LOKAL[^>]*-->\s*<script>\n)([\s\S]*?)(\n</script>)', html)
> open('index.html', 'w', encoding='utf-8').write(html[:m.start(2)] + engine + html[m.end(2):])
> print('OK')
> EOF
> ```

## Uji
```bash
node uji-engine.js        # 64 tes mesin (transliterasi, 3 hukum washal, kamus, syarah, penjaga mutu)
```
Uji render DOM (opsional, butuh `npm i jsdom`): memuat `index.html` di jsdom dan mengklik
tombol-tombol utama — 13 skenario.

## Catatan desain
- **Tanpa framework CDN**: versi sebelumnya (React + Babel standalone + Tailwind CDN) blank
  di HP karena `createRoot` tak didefinisikan + pustaka gagal dimuat dari `content://`.
  Versi ini JS vanila murni — satu berkas, jalan di mana saja.
- **Jujur**: fallback offline tidak pernah mengarang terjemahan; cakupan kamus selalu
  dilaporkan; hasil AI dicek kesetiaannya (`isFaithful`, ambang 0,72) dan diberi peringatan
  bila menyimpang dari naskah asli.
- **Rantai model Gemini (Okt 2026)**: `gemini-flash-latest` → `3.8-flash` → `3.6-flash` →
  `3.5-flash-lite` → `3.1-flash-lite` → `2.5-flash`, dengan retry tanpa `generationConfig`
  bila ditolak; timeout 90 detik; 401/403 berhenti dengan pesan yang jelas.
