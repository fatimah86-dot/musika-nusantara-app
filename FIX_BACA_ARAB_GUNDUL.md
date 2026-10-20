# Perbaikan Garshuni: agar bisa membaca teks Arab gundul

Dokumen ini mencatat **diagnosis** dan **perbaikan** atas keluhan: *"Garshuni tidak bisa membaca
teks gundul Arabic / tidak berfungsi semua"*.

Tanggal perbaikan: 19 Oktober 2026.

---

## 1. Diagnosis - kenapa tidak pernah bisa membaca Arab gundul

Ada **empat penyebab** yang saling menumpuk. Tiga di antaranya fatal.

### 1.1 OCR-nya memakai mesin yang memang tidak punya model Arab (fatal)

`OcrProcessor.kt` memakai `TextRecognizerOptions.DEFAULT_OPTIONS` (model **Latin**) dengan
dependensi `com.google.mlkit:text-recognition:16.0.1`.

Fakta resmi ML Kit Text Recognition v2: model yang tersedia hanya **Latin, Tionghoa, Devanagari,
Jepang, dan Korea**. **Tidak ada model aksara Arab** - artifact `com.google.mlkit:text-recognition-arabic`
bahkan tidak pernah ada di Google Maven (dicek langsung: 404). Seberapa pun bagus foto naskahnya,
OCR on-device **tidak akan pernah** mengeluarkan huruf hijaiyah.

### 1.2 Kegagalan OCR ditutupi teks contoh (fatal, menyesatkan)

`GarshuniViewModel.performOcrAndProcess()` versi lama:

```kotlin
if (text.isBlank()) {
    // Fallback to sample manuscript text ...
    text = "برهتية كرير تتلية طوران مزجل بزجل ترقب برهش"
}
```

Karena OCR selalu kosong untuk naskah Arab, aplikasi selalu menyuntikkan **teks contoh Birhatiyah**
yang lalu terdeteksi sebagai `SURYANI_BIRHATIYAH`. Apa pun yang dipindai, hasilnya selalu "asma
Suryani" yang sama.

### 1.3 Semua model Gemini yang dipanggil sudah dimatikan Google (fatal)

`GeminiService.kt` versi lama memakai `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`.
Status per Oktober 2026 (sumber: Gemini API changelog & halaman deprecations Google):

| Model | Status |
| --- | --- |
| `gemini-1.5-flash` / `gemini-1.5-pro` | **shut down 29 Sep 2025** |
| `gemini-2.0-flash` | **shut down 1 Jun 2026** |
| `gemini-2.5-flash` | **pensiun 20 Okt 2026**, sejak 18 Sep 2026 hanya untuk proyek lama |

Setiap panggilan balik `404`, lalu aplikasi jatuh ke korpus lokal berisi ±20 frasa hafalan.
Body masih mengirim `"temperature": 0.2` yang diabaikan sejak Gemini 3.6 dan ditolak (400) pada
model berikutnya; `thinkingBudget` juga ditolak Gemini 4.

### 1.4 Kunci API tidak pernah sampai ke APK

`.env.example` berisi `GEMINI_API_KEY=MY_GEMINI_API_KEY` (placeholder) dan `.env` di-gitignore.
APK hasil GitHub Actions berisi placeholder itu sehingga `isApiKeyConfigured()` selalu `false`,
dan semua fitur AI diam-diam turun ke korpus lokal. Tidak ada tempat di aplikasi untuk isi kunci.

### 1.5 Bug pendukung lain

| Masalah | Akibat |
| --- | --- |
| Foto didecode tanpa koreksi orientasi EXIF | Foto kamera terbaca miring/terbalik |
| `decodeStream()` tanpa downsampling | Foto 12 MP rawan OOM |
| `ScriptDetector` selalu `return TYPE_ARAB_GUNDUL` | Latin & berharokat salah kelas |
| Kata kunci `"hikmah"`, `"suryani"` | Teks fiqih biasa dilempar ke jalur Birhatiyah |
| Transliterasi membuang semua harokat | "فَصْلٌ" menjadi "fshl"; أ إ آ ؤ ئ ى ڤ ڠ ݢ چ ڽ ۏ hilang |
| `parseSuryaniResponse` regex `\[.*?\]` | Judul `[URAIAN HURUF / LETTER BREAKDOWN]` ikut terpotong |
| `TtsHelper` membuang permintaan sebelum `onInit` | Tombol Audio terasa "mati" pertama ditekan |
| Izin `CAMERA` dideklarasikan tanpa permintaan runtime | Kamera sistem melempar `SecurityException` |
| `saveToDatabase` selalu `insert` dengan `id = 0` | Menyimpan dua kali = baris duplikat |
| Pengaturan tidak disimpan | Kembali ke nilai awal setiap aplikasi dibuka |
| `isPesantrenGandul` tidak pernah dipakai | Sakelar "Gaya Pesantren" tidak berpengaruh |

---

## 2. Perbaikan yang dilakukan

### 2.1 Pembacaan naskah Arab dari foto: Gemini Vision

Karena ML Kit tidak punya model Arab, pembacaan naskah dari foto dipindah ke **Gemini Vision**:
gambar dikirim sebagai `inline_data` JPEG base64 (sisi terpanjang 1568 px, kualitas 85), lalu model
diminta membalas **JSON terstruktur** (`aksara`, `teks_asli`, `teks_harokat`, `transliterasi`,
`terjemah_indonesia`, `uraian_huruf`, `kualitas_bacaan`, `catatan`). Satu panggilan mengisi keempat
tab hasil. ML Kit tetap dipakai jujur sebagai mesin **Latin** (catatan pinggir/daftar isi) plus
deteksi cepat "halaman ini bukan Arab".

### 2.2 Tiga pilihan mesin di layar Pemindai & Pengaturan

| Mesin | Perilaku |
| --- | --- |
| **Otomatis** (bawaan) | ML Kit dulu; bila tidak memuat aksara Arab -> otomatis ke Gemini Vision |
| **AI Vision (Gemini)** | Selalu lewat Gemini; mendukung Arab gundul, Jawi/Pegon, Suryani |
| **Offline (ML Kit)** | Tanpa internet; hanya aksara Latin |

### 2.3 Model & parameter API diperbarui (Oktober 2026)

- Daftar model: `gemini-flash-latest`, `gemini-3.8-flash`, `gemini-3.6-flash`,
  `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-2.5-flash` (fallback berjenjang).
- `temperature`/`topP`/`topK` **tidak dikirim lagi**; `thinkingBudget` tidak dipakai.
- `thinkingLevel: "LOW"` + **ulang otomatis tanpa `generationConfig`** bila API menolak (400),
  lalu turun ke model berikutnya.
- Kunci lewat header `x-goog-api-key`.
- Pesan error manusiawi: 401/403 (kunci salah), 404 (model tidak ada), 413 (gambar terlalu besar),
  429 (kuota habis), 5xx (server).

### 2.4 Kunci API bisa diisi dari dalam aplikasi

`SettingsRepository` (Jetpack DataStore) menyimpan kunci privat di perangkat. Layar **Pengaturan**
punya kolom `GEMINI_API_KEY` + tombol **Simpan / Hapus / Uji**. Prioritas: DataStore -> `BuildConfig`.

### 2.5 Kegagalan tidak lagi disamarkan

Teks contoh Birhatiyah dihapus; kegagalan dilaporkan apa adanya + solusinya
(`GarshuniViewModel.OCR_ARABIC_LIMITATION_MESSAGE`). Setiap hasil membawa `notice` yang tampil di
layar Hasil: sumber AI/offline, peringatan bila harokat AI menyimpang, catatan bagian tak terbaca.

### 2.6 Penjaga mutu auto-harokat (`HarakatValidator`)

Kerangka huruf (tanpa tasykil; varian أ/إ/آ/ٱ->ا, ى/ی->ي, ة->ه disamakan) dibandingkan dengan
jarak Levenshtein: skor >= 0,72 diterima; di bawah itu **dicoba ulang** dengan instruksi keras;
masih menyimpang -> hasil tetap ditampilkan **dengan peringatan jujur** + persentase kemiripan.

### 2.7 Transliterasi benar (`ArabicTransliterator`)

Tasydid ganda, vokal panjang (aa/uu/ii), diftong ai/au, `ال` qamariyah (*al-*) vs syamsiyah
(*ar-rahmaan*, *asy-syams*, *ath-thahaarah*, *an-nuur*, *ash-shalaati*), lam bertasydid
(*allatii*, *alladzii*), lafazh khusus (*Allaah*, *Lillaah*), ta' marbuthah *t*/*h*,
hamzah pembawa (*an*, *illaa*, *ahkaami*, *mu'minun*), liaison tanwin+artikel
(*arkan* + *al-aslam* -> *arkanal-aslam*), dan huruf Jawi/Pegon (ڤ p, ڠ ng, ݢ g, چ c, ڽ ny, ۏ v).

Contoh (diverifikasi 15+ kasus uji):

```
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ  ->  bismi Allaahi ar-rahmaani ar-rahiimi
فَصْلٌ أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ      ->  fashlun arkaanu al-islaami khamsatun
الشَّمْسُ                                 ->  asy-syamsu
مُحَمَّدٌ رَسُولُ اللهِ                    ->  muhammadun rasuulu Allaahi
```

### 2.8 Deteksi aksara benar (`ScriptDetector`)

Mengembalikan jumlah huruf Arab/Suryani/Latin, jumlah harokat, **rasio harokat** (< 15% = gundul),
huruf Jawi/Pegon, kata kunci Birhatiyah yang cocok, dan jenis aksara (`ARAB_GUNDUL` /
`SURYANI_BIRHATIYAH` / `LATIN`). Kata kunci umum `"hikmah"`/`"suryani"` dihapus dari pemicu.

### 2.9 Citra: EXIF, memori, resolusi

`ImageLoader` (baru): baca dimensi -> `inSampleSize` -> decode hemat memori -> **rotasi EXIF**
-> batasi 2048 px. `ImagePreprocessor`: `upscaleForOcr()` (foto kecil -> >= 1600 px sebelum OCR),
`scaleDown()`, `rotate()`, `encodeJpegBase64()`. Tombol **Potret** ditambahkan di Pemindai.

### 2.10 Lainnya

- Izin `CAMERA` dihapus dari manifest (memicu `SecurityException` bila dideklarasikan tanpa
  permintaan runtime); ditambah `<queries>` TTS/SEND + `ACCESS_NETWORK_STATE`.
- `TtsHelper`: antrean sebelum `onInit`, pemecahan teks panjang, pesan bila suara Arab tidak ada.
- `saveToDatabase`: `id != 0` -> `update` (tidak duplikat).
- Pengaturan persisten lewat DataStore (debounce 350 ms); sakelar **Gaya Pesantren Tradisional**
  kini benar-benar mengubah prompt terjemah; tambah opsi **Simpan Otomatis ke Riwayat**.
- Dependensi baru: `androidx.exifinterface:exifinterface:1.3.7`,
  `androidx.datastore:datastore-preferences:1.1.7`.

---

## 3. Cara mengaktifkan (wajib dibaca)

1. Ambil kunci API gratis di <https://aistudio.google.com/apikey>.
2. Pasang APK -> buka **Pengaturan** -> tempel kunci di kolom `GEMINI_API_KEY` -> **Simpan** -> **Uji**.
3. Buka **Pemindai Naskah** -> mesin **AI Vision (Gemini)** atau **Otomatis** ->
   **Pilih Foto** / **Potret** -> **Baca Naskah dengan AI Vision**.

Alternatif build sendiri (kunci terbundel di APK):

```bash
cp .env.example .env   # isi GEMINI_API_KEY=AIza...
gradle assembleDebug
```

> Tanpa kunci API, aplikasi tetap jalan **offline** dengan korpus kitab bawaan (`KitabLibraryData`),
> tetapi pembacaan naskah Arab dari foto tidak tersedia - memang tidak ada OCR Arab di perangkat.

---

## 4. Berkas yang diubah/ditambah

| Berkas | Perubahan |
| --- | --- |
| `data/ai/GeminiService.kt` | Model 2026, tanpa `temperature`, `thinkingLevel` + retry 400, **Vision OCR**, penjaga mutu, pesan error manusiawi, kunci runtime |
| `data/ai/ScriptDetector.kt` | Analisis aksara lengkap (rasio harokat, Jawi/Pegon, Latin) |
| `data/ai/HarakatValidator.kt` | **baru** - Levenshtein pada kerangka kata |
| `data/local/SettingsRepository.kt` | **baru** - DataStore (kunci API, mesin, preferensi) |
| `util/OcrProcessor.kt` | Mesin Latin dinyatakan jujur; upscale; rotasi; NFKC; `close()` |
| `util/ArabicTransliterator.kt` | **baru** - transliterasi sadar harokat |
| `util/ImagePreprocessor.kt` | `upscaleForOcr`, `scaleDown`, `rotate`, EXIF, `encodeJpegBase64` |
| `util/ImageLoader.kt` | **baru** - decode hemat memori + koreksi EXIF |
| `util/TtsHelper.kt` | Antrean init, pemecahan teks, laporan bahasa |
| `ui/GarshuniViewModel.kt` | Alur mesin (AUTO/AI_VISION/ON_DEVICE), tanpa teks palsu, `notice`, simpan/update, pengaturan persisten |
| `ui/screens/ScannerScreen.kt` | Kartu mesin pembaca, tombol Potret, peringatan kunci API |
| `ui/screens/SettingsScreen.kt` | Kolom kunci API (Simpan/Hapus/Uji), pilihan mesin, simpan otomatis |
| `ui/screens/ResultScreen.kt` | Kartu `notice` + kualitas bacaan + catatan bagian tak terbaca |
| `AndroidManifest.xml` | Hapus izin `CAMERA`, tambah `<queries>`, `ACCESS_NETWORK_STATE` |
| `app/build.gradle.kts`, `gradle/libs.versions.toml` | Dependensi DataStore & ExifInterface |
| `app/src/test/.../ScriptDetectorTest.kt` | **baru** - 8 uji deteksi aksara |
| `app/src/test/.../ArabicTransliteratorTest.kt` | **baru** - 15 uji transliterasi + validator |
| `.github/workflows/build-apk.yml` | Job unit test terpisah (APK tetap terbit walau uji gagal) |

## 5. Yang sengaja TIDAK diubah

- **Firebase AI Logic / App Check** masih di dependensi walau tidak dipakai kode mana pun
  (GeminiService memanggil REST langsung). Menghapusnya berarti mengubah plugin `google-services`
  dan trik `google-services.json` palsu di CI - layak dibersihkan nanti (menghemat ±1-2 MB APK).
- Skema Room tetap `version = 1`; tema, font Amiri, dan tata letak layar tidak diubah.
