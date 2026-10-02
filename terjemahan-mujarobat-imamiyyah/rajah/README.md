# Rajah / Wafaq / Tilsam / Tabel Mistik — Crop 300 DPI

Folder ini menampung hasil crop **langsung kotak rajah/wafaq/tilsam/tabel** dari halaman PDF asli kitab Mujarrabāt al-Imāmiyyah, sesuai instruksi ketat:

- **Resolusi 300 DPI**, latar putih bersih tanpa teks sekeliling yang terpotong.
- **Nama berkas:** `rajah_pXXX_Y.png` — `pXXX` = nomor halaman PDF (3 digit), `Y` = urutan rajah pada halaman tersebut (a,b,c) atau keterangan singkat. Contoh: `rajah_p011_ath-Thab'ah.png`, `rajah_p053_humma_tsalats.png`, `rajah_p174_risalah_ayat.png`.
- **Ditampilkan** di halaman terkait dalam `BATCH_*.md`, `TERJEMAHAN.md`, dan `TERJEMAHAN_MATAN_MURNI.md` beserta keterangan cara bacanya menurut kitab (mis. “dibaca 7×, ditulis dengan misik dan za'faran pada kertas putih, dibawa…”).
- **Batch 01 (PDF 1–5):** Tidak ada rajah — folder kosong pada batch ini. Crop dimulai Batch 02 (Mukadimah) dan Batch 03+ (khasiat surah, demam hal. 53–56, rezeki hal. 143–174, dll.).

Cara crop: `pymupdf` → `page.get_pixmap(dpi=300, clip=rect)` diperhalus dengan `PIL.Image` (white background), disimpan PNG tanpa kompresi berlebih.

Saat khatam, seluruh rajah akan terpasang di `KHATAM_TERJEMAHAN_Mujarrabat_al_Imamiyyah.pdf` (A4) pada posisi tepat di bawah pasal terkait.
