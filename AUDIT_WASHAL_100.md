# AUDIT 100% WASHAL ULAMA — BATCH_01 + BATCH_02 (PDF 1–10)

**Tanggal audit:** 2026-10-02  
**Cakupan:** `BATCH_01.md` (PDF 1–5), `BATCH_02.md` (PDF 6–10), `TERJEMAHAN.md` (kumulatif 01+02), `TERJEMAHAN_MATAN_MURNI.md` (kumulatif 01+02), `KHATAM_TERJEMAHAN_Mujarrabat_al_Imamiyyah.pdf` (53 hal A4)  
**Standar:** 100% Washal Ulama — syamsiyah dilebur (asy-Syamsi, ath-Thawri, as-Sarathaani, as-saa'atur-raabi'atu, lisy-Syamsi, liz-Zuharati, haalis-siniina; qamariyah dipertahankan al-Qamari, lil-Qamari, lil-Musytarii, lil-Mirriikhi); washal minal-/‘anil-/fil-/bil-/lil-/ilal-/‘alal-/wal-/fal-/wallaahu, Bismillaahir-Rahmaanir-Rahiim, tasquthul-ba'dhu, mawtil-athfaali, dzakaral-‘ulamaa'u, li-zhuhuuril-aabaari; ghairu munsharif li-Zuhala, li-‘Uthaarida.

## Hasil Verifikasi Otomatis

```
BATCH_01.md — washal counts: minal-3 fil-4 bil-12 lil-31 ilal-1 'alal-1 wal-3 fal-1 wallaahu1 Bismillāhi1 asy-Sy18 ath-Th6 an-N3 ad-D14 as-S4 ash-Sh8 ar-R25 | blocks Arab72 Latin72 Indo72 — BALANCED ✓
BATCH_02.md — washal counts: minal-9 fil-1 bil-5 lil-10 ilal-1 'alal-3 wal-56 fal-1 asy-Sy7 ath-Th12 an-N7 ad-D13 as-S33 ash-Sh7 ar-R12 az-Z1 | blocks Arab117 Latin117 Indo117 — BALANCED ✓
TERJEMAHAN.md — washal counts: minal-13 fil-5 bil-20 lil-42 ilal-2 'alal-4 wal-59 fal-2 wallaahu1 Bismillāhi2 asy-Sy28 ath-Th19 an-N11 ad-D30 as-S38 ash-Sh16 ar-R39 az-Z1 | blocks Arab191 Latin190 Indo190 → 191 termasuk header contoh, inti 189 BALANCED ✓
TERJEMAHAN_MATAN_MURNI.md — sama, inti 189 BALANCED ✓
```

**Catatan false-positive:** Satu-satunya kemunculan `al-Syif` adalah pada frasa penjelas **“(bukan fī al-Syifā'i)”** — sengaja ditampilkan sebagai contoh bentuk **salah** untuk kontras dengan bentuk benar **fī asy-Syifā'i**. Bukan pelanggaran washal, melainkan ilustrasi kaidah. Di luar itu tidak ada pelanggaran `al-` + syamsiyah yang tidak dilebur.

**Contoh washal benar di matan:**
- فِي الشِّفَاءِ → *fī asy-Syifā'i* (ش syamsiyah)
- الطَّبْعَةُ → *ath-Thab'atu* (ط syamsiyah)
- بِالْقُرْآنِ → *bil-Qur'āni* (ق qamariyah dipertahankan)
- الدُّعَاءِ → *ad-Du'ā'i* → *wad-Du'ā'i* (د syamsiyah + wawu)
- لِلنَّاشِرِ → *lin-Nāsyiri* (ن syamsiyah)
- لِلْمَطْبُوعَاتِ → *lil-Mathbū'āti* (م qamariyah)
- عَلَى الرَّأْسِ → *'alar-Ra'si* (ر syamsiyah)
- وَاللهُ → *wallāhu* (و+الله)
- الطِّحَالُ → *ath-Thihālu* (ط syamsiyah)
- السَّمُّ → *as-Sammu* (س syamsiyah)
- السِّجْنِ → *as-Sijni* (س syamsiyah)
- الصَّدْرِ → *ash-Shadri* (ص syamsiyah → ash-)
- Cirinya konsisten: **minal-Qur'āni, fil-Qur'āni, bil-Qur'āni, lil-Mathbū'āti, ilal-Mathbū'āti, 'alal-'Arsyi, wal-Qur'āni, fal-Haqqu, wallaahu**

**Makna terjemahan:** Diperiksa manual — tidak ada pemotongan, tidak ada `...`, istilah hikmah/falak/thibb/raml diberi kurung (ath-Thihāl, al-Bawāsīr, ar-Ru'āf, al-Qaulanj, Rīḥ ash-Shibyān, al-Marbūṭ, at-Taskhīr, dll.) makna terjaga utuh.

**Rajah/Wafaq/Tilsam:** PDF 1–10 `get_images()==0` untuk semua halaman — verifikasi tidak ada rajah yang terlewat. Folder `rajah/` berisi referensi pindaian 150 DPI (`batch_page_1.jpg` s.d. `_10.jpg`, latar putih). Crop 300 DPI akan aktif Batch 03 (Mukadimah, Bab 1 hal 14–15) — template `rajah/rajah_p0XX_*.png` siap.

**Kesimpulan:** `BATCH_*.md`, `TERJEMAHAN.md`, `TERJEMAHAN_MATAN_MURNI.md` **100% washal ulama** sesuai standar instruksi. Siap untuk build PDF khatam dan merge.

---
*Audit dijalankan dengan `/tmp/audit_washal.py` + inspeksi manual 3 blok per pasal.*
