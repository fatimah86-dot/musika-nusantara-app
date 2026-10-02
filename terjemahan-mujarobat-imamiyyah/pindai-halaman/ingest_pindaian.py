#!/usr/bin/env python3
"""Ingest gambar pindaian halaman kitab ke folder ini sesuai INDEX.md.

Ditulis agar bisa jalan di sandbox minim-dependency: HANYA memakai pustaka
standar Python 3 (tanpa Pillow / tesseract / opencv).

Alur kerja
----------
1.  Baca tabel di `INDEX.md` -> daftar (nomor halaman tercetak, nama berkas
    target, bab, keterangan).
2.  `--report`   : tampilkan status (berkas masuk / kurang / duplikat / liar).
3.  (default)    : salin berkas dari --src (bawaan /home/user/uploads) ke folder
    ini. Penamaan ditentukan begitu:
      a. nama berkas memuat `hal-NNN` atau `NNN` yang cocok dengan satu nomor
         halaman di INDEX  -> langsung jadi `hal-NNN.jpg`;
      b. sisanya           -> `belum-urut-NN.<ekstensi asli>`, supaya nanti
         dinomori manual setelah nomor halaman di pojok bawah gambar dibaca.
    Berkas TIDAK PERNAH dipindah atau ditimpa (kecuali --force).
4.  Tulis `MANIFEST.csv`: halaman, nama target, berkas asal, ukuran, piksel,
    sha256 pendek, status.

Contoh
------
    python3 ingest_pindaian.py --report
    python3 ingest_pindaian.py --src /home/user/uploads
    python3 ingest_pindaian.py --promote belum-urut-141.jpg 141   # setelah dicek
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
INDEX = HERE / "INDEX.md"
MANIFEST = HERE / "MANIFEST.csv"
DEFAULT_SRC = Path("/home/user/uploads")

ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
ROW_RE = re.compile(r"^\|(?P<cells>[^|]+\|.+)\|\s*$")


def to_ascii_number(text: str) -> int | None:
    """'١٤ (14)' / '(14)' / '14' -> 14.  Mengabaikan angka Arab maupun Latin."""
    text = text.strip()
    for ch in ARABIC_DIGITS:
        text = text.replace(ch, str(ARABIC_DIGITS.index(ch)))
    m = re.search(r"\d{1,4}", text)
    return int(m.group()) if m else None


def parse_index(path: Path) -> list[dict]:
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(line)
        if not m:
            continue
        cells = [c.strip() for c in m.group("cells").split("|")]
        if len(cells) < 2 or set("".join(cells)) <= set("-: "):
            continue  # baris header / pemisah tabel
        printed = to_ascii_number(cells[0])
        target = cells[1]
        if printed is None or not target.endswith(".jpg"):
            continue
        rows.append(
            {
                "page": printed,
                "target": target,
                "bab": cells[2] if len(cells) > 2 else "",
                "note": cells[3] if len(cells) > 3 else "",
                "uncertain": "?" in cells[0],
            }
        )
    return rows


def image_size(path: Path) -> str:
    """Ukuran piksel PNG/JPEG tanpa dependency tambahan."""
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        i = 8
        while i + 8 <= len(data):
            length = int.from_bytes(data[i : i + 4], "big")
            kind = data[i + 4 : i + 8]
            if kind == b"IHDR":
                w = int.from_bytes(data[i + 8 : i + 12], "big")
                h = int.from_bytes(data[i + 12 : i + 16], "big")
                return f"{w}x{h}"
            i += 12 + length
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            seg_len = int.from_bytes(data[i + 2 : i + 4], "big")
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h = int.from_bytes(data[i + 5 : i + 7], "big")
                w = int.from_bytes(data[i + 7 : i + 9], "big")
                return f"{w}x{h}"
            i += 2 + seg_len
    return "?"


def sha16(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def list_images(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        p
        for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
    )


def page_of_name(name: str) -> int | None:
    """Perkiraan nomor halaman dari nama berkas (belum tentu benar, diverifikasi lagi).

    `hal-014.jpg` -> 14, `scan_016.jpg` -> 16, `IMG_2026-page-50.jpg` -> 50
    (gugus angka terakhir yang dipakai, karena penomoran halaman biasanya di
    ujung nama). Angka tahun 4 digit seperti 2026 diabaikan bila tidak ada di
    indeks.
    """
    stem = Path(name).stem
    if re.match(r"belum-urut-\d+$", stem, re.I):
        return None  # nomor antrean sementara, bukan nomor halaman kitab
    m = re.search(r"hal[-_]?0*(\d{1,3})$", stem, re.I) or re.search(r"hal[-_]?0*(\d{1,3})", stem, re.I)
    if m:
        return int(m.group(1))
    digits = re.findall(r"\d{1,4}", stem)
    if not digits:
        return None
    cand = int(digits[-1].lstrip("0") or "0")
    if len(digits[-1]) == 4 and cand > 1000:  # kemungkinan tahun pada nama kamera
        cand = int(digits[-2].lstrip("0") or "0") if len(digits) > 1 else 0
    return cand or None


def existing_by_page() -> dict[int, str]:
    """Nomor halaman -> nama berkas yang sudah ada di folder ini."""
    out: dict[int, str] = {}
    for q in list_images(HERE):
        pg = page_of_name(q.name)
        if pg is not None and pg not in out:
            out[pg] = q.name
    return out


def cmd_report(rows: list[dict]) -> int:
    present = {p.name for p in list_images(HERE)}
    pages = [r["page"] for r in rows]
    targets = [r["target"] for r in rows]
    dupes = sorted({t for t in targets if targets.count(t) > 1})
    dupe_pages = sorted({x for x in pages if pages.count(x) > 1})
    have = set(existing_by_page())
    want = set(pages)
    named = {q.name for q in list_images(HERE)}
    have |= {r["page"] for r in rows if r["target"] in named}  # hal. yang targetnya belum-urut-*
    named = {q for q in present if not re.match(r"belum-urut-\d+\.", q)}
    stray = sorted(q for q in named if page_of_name(q) not in want)
    print(f"Baris indeks       : {len(rows)} halaman tercetak (rentang {min(pages)}\u2013{max(pages)})")
    print(f"Berkas di folder   : {len(present)} gambar, {len(have)} sudah bernomor halaman")
    print(f"Terjemah siap       : {len(have & want)} dari {len(want)}")
    if want - have:
        miss = sorted(want - have)
        shown = ", ".join(str(x) for x in miss[:30]) + (" \u2026" if len(miss) > 30 else "")
        print(f"Belum masuk        : {shown}")
    if have - want:
        print(f"Nomor di luar indeks: {sorted(have - want)}")
    print(f"Nomor belum pasti (?) : {sum(1 for r in rows if r['uncertain'])}")
    if dupes:
        print(f"!! target duplikat di tabel: {', '.join(dupes)}")
    if dupe_pages:
        print(f"!! nomor halaman dobel di tabel: {dupe_pages}")
    if stray:
        print(f"?  berkas belum terhubung ke nomor: {', '.join(stray)}")
    return 0


def cmd_ingest(src: Path, force: bool) -> int:
    rows = parse_index(INDEX)
    if not src.is_dir():
        print(f"SUMBER TIDAK ADA: {src}\nLetakkan gambar hasil lampiran di sana, lalu jalankan ulang.", file=sys.stderr)
        return 2
    incoming = list_images(src)
    if not incoming:
        print(f"Tidak ada gambar di {src} (folder ada tapi kosong).", file=sys.stderr)
        return 2

    by_page: dict[int, dict] = {}
    by_stem: dict[str, dict] = {}
    for r in rows:
        by_page.setdefault(r["page"], r)
        by_stem[Path(r["target"]).stem] = r
    HERE.mkdir(parents=True, exist_ok=True)

    # Perbandingan per NOMOR HALAMAN (bukan per nama berkas), supaya hal-014.png
    # tetap dihitung mengisi halaman 14 dan tidak menghasilkan salinan kembar.
    filled = existing_by_page()
    sudah = list_images(HERE)
    slot = max([int(m.group(1)) for q in sudah if (m := re.match(r"belum-urut-(\d+)\.", q.name))] or [0])
    hashes: dict[Path, str] = {}

    def digest(path: Path) -> str:
        if path not in hashes:
            hashes[path] = sha16(path)
        return hashes[path]

    seen_hash = {digest(q): q.name for q in sudah}

    records: list[dict] = []
    for p in incoming:
        page = page_of_name(p.name)
        suffix = p.suffix.lower()
        row = by_page.get(page) if page is not None else None
        if row is None:  # nama berkas sudah memakai nama target indeks (mis. belum-urut-141.jpg)
            row = by_stem.get(Path(p.name).stem)
        if page is not None and page in filled and not force:
            records.append(
                {
                    "page": page,
                    "file": filled[page],
                    "src": p.name,
                    "status": "sudah-ada"
                    + ("" if digest(HERE / filled[page]) == digest(p) else " !!ISI-BEDA-periksa"),
                }
            )
            continue
        if row is not None:
            target = Path(row["target"]).with_suffix(suffix)
            status = "cocok-indeks" if suffix in {".jpg", ".jpeg"} else f"cocok-indeks(gambar-{suffix.lstrip('.')})"
            page = row["page"]
        elif not force and (pg := digest(p)) in seen_hash:
            # tak dikenali nomornya, tapi isinya sama persis dengan berkas yang sudah ada
            records.append({"page": page or "", "file": seen_hash[pg], "src": p.name, "status": "sudah-ada(hash-identik)"})
            continue
        else:
            slot += 1
            target = Path(f"belum-urut-{slot:03d}{suffix}")
            status = "perlu-cek-nomor"
        dest = HERE / target.name
        if dest.exists() and not force:
            records.append({"page": page or "", "file": target.name, "src": p.name, "status": "dilewati-sudah-ada"})
            continue
        shutil.copy2(p, dest)
        if row is not None:
            filled[page] = dest.name
        seen_hash[digest(dest)] = dest.name
        records.append(
            {
                "page": page or "",
                "file": target.name,
                "src": p.name,
                "bytes": dest.stat().st_size,
                "pixel": image_size(dest),
                "sha256_16": digest(dest),
                "status": status,
            }
        )

    with MANIFEST.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(
            fh,
            fieldnames=["page", "file", "src", "bytes", "pixel", "sha256_16", "status"],
            lineterminator="\n",
            extrasaction="ignore",
        )
        w.writeheader()
        w.writerows(records)

    baru = sum(1 for r in records if "sudah-ada" not in r["status"])
    ok = sum(1 for r in records if r["status"].startswith("cocok-indeks"))
    manual = sum(1 for r in records if r["status"] == "perlu-cek-nomor")
    print(f"{baru} berkas baru disalin dari {src} ke {HERE.name}/  ({ok} cocok indeks, {manual} perlu dicek nomornya)")
    if manual:
        print(f"Buka gambar `belum-urut-*` untuk membaca angka Arab di pojok bawah, lalu: python3 {Path(__file__).name} --promote <berkas> <nomor>")
    return 0


def cmd_promote(src_name: str, page: int) -> int:
    src = HERE / src_name
    if not src.is_file():
        print(f"Tidak menemukan {src}", file=sys.stderr)
        return 2
    dest = HERE / f"hal-{page:03d}{src.suffix.lower()}"
    if dest.exists():
        print(f"{dest.name} sudah ada — batalkan dulu/manual.", file=sys.stderr)
        return 2
    src.rename(dest)
    print(f"{src.name} -> {dest.name}")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC, help=f"folder sumber gambar (bawaan {DEFAULT_SRC})")
    ap.add_argument("--force", action="store_true", help="menimpa berkas yang sudah ada")
    ap.add_argument("--report", action="store_true", help="hitung status saja, tidak menyalin")
    ap.add_argument("--promote", nargs=2, metavar=("BERKAS", "HALAMAN"), help="ganti nama belum-urut-* jadi hal-NNN.jpg")
    a = ap.parse_args(argv)
    rows = parse_index(INDEX)
    if a.promote:
        return cmd_promote(a.promote[0], int(a.promote[1]))
    if a.report:
        return cmd_report(rows)
    return cmd_ingest(a.src, a.force)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
