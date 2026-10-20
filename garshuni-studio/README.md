# Garshuni Studio — versi perbaikan

Web app untuk membaca **teks Arab gundul**: harokat (tasykil), bacaan Washal (Latin),
terjemahan Indonesia, plus ekstraksi teks dari txt/docx/pdf/gambar.

## Cara pakai
1. Buka `index.html` lewat server statis (bukan `file://`), misal:
   `python3 -m http.server 8080` lalu buka `http://localhost:8080`.
2. Klik **Konfigurasi API** → isi `GEMINI_API_KEY` dari
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Uji Koneksi** → **Simpan**.
   Tanpa kunci pun aplikasi tetap jalan: mode offline (kamus lokal) dengan cakupan yang dilaporkan jujur.
3. Ketik/tempel teks Arab gundul, atau unggah .txt/.docx/.pdf/gambar.

## Bug yang diperbaiki dari versi sebelumnya
1. **Model `gemini-2.5-flash` sudah pensiun** (20 Okt 2026) → semua panggilan AI gagal.
   Kini memakai rantai model: `gemini-flash-latest` → `3.8-flash` → `3.6-flash` →
   `3.5-flash-lite` → `3.1-flash-lite` → `2.5-flash` (cadangan proyek lama).
2. **`parseJSON` tidak pernah didefinisikan** → `ReferenceError` setiap tombol proses ditekan.
3. **Fungsi `generateHarokat`/`extractTextFromImage`/`copyToClipboard`/`downloadTXT` berada di
   luar `App`** tetapi memanggil `setResults`/`setError` (state milik `App`) → `ReferenceError`.
   Semua kini berada di dalam `App`.
4. **Fallback palsu**: `localFallbackWashal`/`localFallbackTranslation` mengembalikan teks contoh
   (TEST_SAMPLE) untuk SEMUA input. Kini jujur: transliterasi lokal nyata, dan terjemahan offline
   hanya untuk teks contoh — selain itu dikatakan terus terang butuh API key.
5. **Regex `\b` tidak pernah cocok dengan huruf Arab** (`\w` hanya ASCII) → `localFallbackHarokat`
   tidak pernah mengubah apa pun. Kini kamus berbasis split kata (`naskah-engine.js`), dengan
   toleransi hamzah/ta marbuthah (skeleton) dan awalan tergabung (mis. `والانسان` → `وَالْإِنْسَانِ`).
6. **Model dipaksa JSON di semua endpoint** → kini `thinkingLevel: LOW` dengan retry otomatis
   tanpa `generationConfig` bila ditolak, lalu lanjut model berikutnya; 401/403 berhenti dengan
   pesan yang jelas.
7. **Modal API key terkunci tanpa tombol tutup** → kini ada "Lanjut Tanpa Key", "Uji Koneksi", dan tombol tutup.
8. **Hasil gambar tidak dijamin gundul** → kini dibersihkan (`cleanExtractedArabic`) dan tab
   otomatis pindah ke Translator.
9. **PDF >5 halaman diam-diam dipotong** → kini diberitahukan via banner.
10. **Penjaga mutu**: hasil harokat AI dicek kesetiaannya terhadap teks asli
    (`isFaithful`, ambang 0.72) — bila menyimpang muncul peringatan.

## Uji mesin lokal
```
node uji-engine.js   # 35 tes: transliterasi, kamus, kesetiaan, pembersih
```

## Berkas
- `index.html` — aplikasi (React + Babel standalone + Tailwind CDN)
- `naskah-engine.js` — mesin lokal murni JS (dipakai `index.html`, bisa diuji via Node)
- `uji-engine.js` — unit test mesin lokal
