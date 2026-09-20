#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bangun PDF dari Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.md

Arab murni : shaping (arabic-reshaper) + pemenggalan baris RTL mandiri —
             kata dipecah dalam urutan logis, lebar diukur per font, tiap baris
             disusun ulang ke urutan visual (kanan-ke-kiri) sehingga urutan
             baris dan urutan kata benar, termasuk <b> per segmen.
Arab campur: reshape + python-bidi per segmen (paragraf berbasis LTR).
Latin      : DejaVu.
"""
import os, re, hashlib, html
import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RlTTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily, stringWidth
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, HRFlowable, PageBreak, Flowable, NextPageTemplate)
from reportlab.platypus.tableofcontents import TableOfContents

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.md")
OUT = os.path.join(HERE, "Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.pdf")
FONTDIR = os.path.join(HERE, "fonts")

# ---------- registrasi font ----------
pdfmetrics.registerFont(RlTTFont("Amiri", os.path.join(FONTDIR, "AmiriMerged-Regular.ttf")))
pdfmetrics.registerFont(RlTTFont("Amiri-Bold", os.path.join(FONTDIR, "AmiriMerged-Bold.ttf")))
pdfmetrics.registerFont(RlTTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"))
registerFontFamily("amiri", normal="Amiri", bold="Amiri-Bold", italic="Amiri", boldItalic="Amiri-Bold")
registerFontFamily("dv", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

RE_AR = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
RE_LATIN = re.compile(r'[A-Za-z]')
def has_arab(t): return bool(RE_AR.search(t))
def is_pure_arab(t): return has_arab(t) and not RE_LATIN.search(t)
def is_rtl_base(t):
    for ch in t:
        if RE_AR.match(ch): return True
        if ch.isalpha(): return False
    return False

_reshaper = arabic_reshaper.ArabicReshaper({'delete_harakat': False})
def shape(t): return _reshaper.reshape(t) if has_arab(t) else t
def shape_display(t): return get_display(shape(t)) if has_arab(t) else t

# ---------- gaya ----------
INK = colors.HexColor("#1a1a1a")
GRAY = colors.HexColor("#444444")
ACCENT = colors.HexColor("#0b5e3f")

S = {}
S["h1"] = ParagraphStyle("h1", fontName="Amiri-Bold", fontSize=16.5, leading=24,
                         textColor=ACCENT, spaceBefore=10, spaceAfter=10, alignment=TA_RIGHT)
S["h2"] = ParagraphStyle("h2", fontName="Amiri-Bold", fontSize=13.5, leading=20,
                         textColor=colors.HexColor("#114a34"), spaceBefore=14, spaceAfter=6, alignment=TA_RIGHT)
S["h3"] = ParagraphStyle("h3", fontName="Amiri-Bold", fontSize=11.8, leading=18,
                         textColor=INK, spaceBefore=10, spaceAfter=4, alignment=TA_RIGHT)
S["body"] = ParagraphStyle("body", fontName="DejaVu", fontSize=10.2, leading=15.2,
                           textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6)
S["bodyar"] = ParagraphStyle("bodyar", fontName="Amiri", fontSize=11, leading=18,
                             alignment=TA_RIGHT, spaceAfter=6)
S["quote_ar"] = ParagraphStyle("quote_ar", fontName="Amiri", fontSize=12.6, leading=21,
                               textColor=INK, alignment=TA_RIGHT, leftIndent=10, rightIndent=2,
                               spaceBefore=2, spaceAfter=2)
S["quote_id"] = ParagraphStyle("quote_id", fontName="DejaVuSerif", fontSize=10.2, leading=15.5,
                               textColor=GRAY, alignment=TA_JUSTIFY, leftIndent=16, rightIndent=8,
                               spaceBefore=1, spaceAfter=6)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=16, bulletIndent=6,
                             alignment=TA_LEFT, spaceAfter=3)
S["bullet_ar"] = ParagraphStyle("bullet_ar", parent=S["bodyar"], leftIndent=16, rightIndent=10, spaceAfter=3)
S["center_ar"] = ParagraphStyle("center_ar", fontName="Amiri-Bold", fontSize=27, leading=42,
                                alignment=TA_CENTER)
S["center_id"] = ParagraphStyle("center_id", fontName="DejaVu-Bold", fontSize=17, leading=24,
                                alignment=TA_CENTER, textColor=INK)
S["center_sm"] = ParagraphStyle("center_sm", fontName="DejaVu", fontSize=10.5, leading=15,
                                alignment=TA_CENTER, textColor=GRAY)

FRAME_W = A4[0] - 4 * cm

# ---------- markup ----------
def clean_inline(t):
    return re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t)

def seg_split(t):
    t = re.sub(r'`([^`]*)`', r'\1', t)
    t = re.sub(r'\*([^*\n]+)\*(?!\*)', r'\1', t)
    parts, pos, bold = [], 0, False
    for m in re.finditer(r'\*\*', t):
        parts.append((bold, t[pos:m.start()]))
        bold = not bold
        pos = m.end()
    parts.append((bold, t[pos:]))
    return [(b, s) for b, s in parts if s != ""]

# ---------- pemenggalan baris RTL ----------
def rtl_lines_xml(text, maxwidth, size, reg="Amiri", bold="Amiri-Bold", bullet=False):
    """Pecah paragraf Arab murni jadi baris-baris visual; kembalikan XML dgn <br/>."""
    # 1) kata-kata dalam urutan logis + flag bold
    words = []  # (bold, word_logical)
    if bullet:
        words.append((False, "•"))
    for b, seg in seg_split(text):
        for w in seg.split():
            if w:
                words.append((b, w))
    # 2) ukur lebar tiap kata (setelah reshape; sambungan antar-kata tidak ada di Arab)
    widths = []
    space_w = stringWidth(" ", reg, size)
    for b, w in words:
        f = bold if b else reg
        widths.append(stringWidth(shape(w), f, size))
    # 3) greedy line-break dalam urutan logis
    lines = []          # tiap baris = list indeks kata
    cur, cur_w = [], 0.0
    for idx, w in enumerate(widths):
        add = w if not cur else cur_w + space_w + w
        if cur and add > maxwidth:
            lines.append(cur); cur, cur_w = [], 0.0
            add = w
        cur.append(idx); cur_w = add
    if cur: lines.append(cur)
    # 4) tiap baris: kelompok segmen bold, reshape+display per segmen, balik urutan segmen
    out_lines = []
    for ln in lines:
        segs = []  # (bold, [kata...])
        for idx in ln:
            b, w = words[idx]
            if segs and segs[-1][0] == b:
                segs[-1][1].append(w)
            else:
                segs.append((b, [w]))
        rendered = []
        for b, ws in segs:
            disp = html.escape(get_display(_reshaper.reshape(" ".join(ws))), quote=False)
            rendered.append(f"<b>{disp}</b>" if b else disp)
        rendered.reverse()
        out_lines.append(" ".join(rendered))
    return out_lines

def md_to_xml(text, mode_width=None):
    """-> (xml, mode) ; mode: 'rtl' | 'mix' | 'ltr'."""
    text = clean_inline(text).strip()
    if not text: return None, "ltr"
    if is_pure_arab(text):
        return "__RTL__", "rtl"   # penanda; pemanggil jalankan rtl_lines_xml dgn parameter gaya
    if has_arab(text):
        segs = seg_split(text)
        rtl = is_rtl_base(text)
        rendered = []
        for b, seg in segs:
            disp = html.escape(shape_display(seg), quote=False)
            rendered.append(f"<b>{disp}</b>" if b else disp)
        if rtl: rendered.reverse()
        return " ".join(rendered), "mix"
    t = re.sub(r'`([^`]*)`', r'\1', text)
    t = re.sub(r'\*\*([^*]+)\*\*', '\x01\\1\x02', t)   # bold -> penanda aman
    t = re.sub(r'\*([^*\n]+)\*', r'\1', t)                 # italic tunggal dibuang
    t = html.escape(t, quote=False)
    t = t.replace('\x01', '<b>').replace('\x02', '</b>')
    return t, "ltr"


def rtl_paras(text, style, bullet=False):
    """Paragraf Arab murni -> beberapa Paragraph satu-baris (tanpa re-wrap)."""
    from reportlab.lib.styles import ParagraphStyle as _PS
    reg = "Amiri-Bold" if "Bold" in style.fontName else "Amiri"
    bold = "Amiri-Bold"
    lines = rtl_lines_xml(text, avail(style), style.fontSize, reg=reg, bold=bold, bullet=bullet)
    tight = _PS("tight_" + style.name, parent=style, spaceBefore=0, spaceAfter=0)
    out = [Paragraph(ln, tight) for ln in lines]
    if style.spaceBefore: out.insert(0, __import__('reportlab.platypus', fromlist=['Spacer']).Spacer(1, style.spaceBefore))
    if style.spaceAfter: out.append(__import__('reportlab.platypus', fromlist=['Spacer']).Spacer(1, style.spaceAfter))
    return out

# ---------- flowables ----------
class DocTemplate(BaseDocTemplate):
    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph):
            name = fl.style.name
            if name in ("h1", "h2", "h3"):
                txt = fl.getPlainText().strip()
                lvl = {"h1": 0, "h2": 1, "h3": 2}[name]
                key = hashlib.md5((txt + str(self.page)).encode()).hexdigest()[:10]
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(txt, key, lvl, closed=(lvl > 0))
                if lvl <= 1:
                    self.notify("TOCEntry", (lvl, txt, self.page, key))

PAGE_W, PAGE_H = A4
def on_page(canv, doc):
    canv.saveState()
    if doc.page > 1:
        canv.setFont("DejaVu", 8.5)
        canv.setFillColor(GRAY)
        canv.drawCentredString(PAGE_W / 2, 1.15 * cm, f"— {doc.page} —")
        canv.setStrokeColor(colors.HexColor("#cccccc")); canv.setLineWidth(0.4)
        canv.line(2 * cm, 1.55 * cm, PAGE_W - 2 * cm, 1.55 * cm)
    canv.restoreState()

# lebar tersedia per gaya (pt) — dikurangi margin aman agar mesin layout
# reportlab tidak memenggal ulang baris yang sudah kita susun
def avail(style):
    return FRAME_W - (style.leftIndent or 0) - (style.rightIndent or 0) - 8

def para_for(text):
    """Buat Paragraph dari teks md mentah, memilih pipeline yg tepat."""
    xml, mode = md_to_xml(text)
    if mode == "rtl":
        return None, "rtl", text
    if mode == "mix":
        st = S["bodyar"] if has_arab(text) else S["body"]
        return Paragraph(xml, st), "mix", text
    return Paragraph(xml, S["body"]), "ltr", text

# ---------- parser ----------
def parse_md(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    start = 0
    for i, ln in enumerate(lines):
        if '<a id="mukakimah">' in ln or '<a id="mukadimah">' in ln: start = i; break
    flow = []
    i, n = start, len(lines)
    quote_buf, in_quote = [], False

    def flush_quote():
        nonlocal quote_buf, in_quote
        if not quote_buf:
            in_quote = False; return
        paras, cur = [], []
        for ql in quote_buf:
            if ql.strip() == "":
                if cur: paras.append(" ".join(cur)); cur = []
            else:
                cur.append(ql.strip())
        if cur: paras.append(" ".join(cur))
        for p in paras:
            if is_pure_arab(p):
                flow.extend(rtl_paras(p, S["quote_ar"]))
            elif has_arab(p):
                xml, _ = md_to_xml(p)
                flow.append(Paragraph(xml, S["quote_id"] if not is_rtl_base(p) else S["bodyar"]))
            else:
                xml, _ = md_to_xml(p)
                flow.append(Paragraph(xml, S["quote_id"]))
        flow.append(Spacer(1, 4))
        quote_buf, in_quote = [], False

    while i < n:
        ln = lines[i]
        stripped = ln.strip()

        if in_quote:
            if stripped.startswith(">"):
                quote_buf.append(stripped.lstrip(">").lstrip())
                i += 1; continue
            flush_quote()

        if stripped == "":
            i += 1; continue
        if stripped.startswith("---"):
            flow.append(Spacer(1, 4))
            flow.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#bbbbbb"),
                                   spaceBefore=4, spaceAfter=8))
            i += 1; continue
        if stripped.startswith("<a id="):
            i += 1; continue

        m = re.match(r'^(#{1,4})\s+(.*)$', stripped)
        if m:
            level, text = len(m.group(1)), clean_inline(m.group(2)).strip()
            stl = S["h1"] if level == 1 else S["h2"] if level == 2 else S["h3"]
            if level == 1: flow.append(PageBreak())
            if is_pure_arab(text):
                flow.extend(rtl_paras(text, stl))
            else:
                xml, _ = md_to_xml(text)
                if xml: flow.append(Paragraph(xml, stl))
            if level == 1:
                flow.append(HRFlowable(width="100%", thickness=1.1, color=ACCENT,
                                       spaceBefore=0, spaceAfter=8))
            i += 1; continue

        if stripped.startswith(">"):
            in_quote = True
            quote_buf.append(stripped.lstrip(">").lstrip())
            i += 1; continue

        if stripped.startswith("- "):
            text = clean_inline(stripped[2:]).strip()
            if is_pure_arab(text):
                flow.extend(rtl_paras(text, S["bullet_ar"], bullet=True))
            elif has_arab(text):
                xml, _ = md_to_xml(text)
                flow.append(Paragraph(xml + " •", S["bullet_ar"]))
            else:
                xml, _ = md_to_xml(text)
                flow.append(Paragraph(xml, S["bullet"], bulletText="•"))
            i += 1; continue

        mnum = re.match(r'^(\d+)[.)]\s+(.*)$', stripped)
        if mnum:
            text = f"{mnum.group(1)}. {clean_inline(mnum.group(2)).strip()}"
            if is_pure_arab(text):
                flow.extend(rtl_paras(text, S["bodyar"]))
            else:
                xml, _ = md_to_xml(text)
                flow.append(Paragraph(xml, S["bodyar"] if has_arab(text) else S["body"]))
            i += 1; continue

        buf = [stripped]
        while i + 1 < n:
            nxt = lines[i + 1].strip()
            if (nxt == "" or nxt.startswith("#") or nxt.startswith(">") or
                    nxt.startswith("- ") or nxt.startswith("---") or nxt.startswith("<a id=")
                    or re.match(r'^\d+[.)]\s', nxt)):
                break
            buf.append(nxt); i += 1
        joined = " ".join(buf)
        if is_pure_arab(joined):
            flow.extend(rtl_paras(joined, S["bodyar"]))
        else:
            xml, _ = md_to_xml(joined)
            flow.append(Paragraph(xml, S["bodyar"] if has_arab(joined) else S["body"]))
        i += 1
    flush_quote()
    return flow

# ---------- rakit ----------
def build():
    doc = DocTemplate(OUT, pagesize=A4,
                      leftMargin=2 * cm, rightMargin=2 * cm,
                      topMargin=2 * cm, bottomMargin=2 * cm,
                      title="Mujarrabat al-Imamiyyah fi as-Syifa' bil-Qur'an wad-Du'a' — Terjemahan Lengkap",
                      author="Muhammad Husain Mughniyah")
    frame = Frame(2 * cm, 1.8 * cm, PAGE_W - 4 * cm, PAGE_H - 3.6 * cm, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])

    story = []
    # ----- Halaman 1: SAMPUL (mengikuti struktur cetakan asli) -----
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(shape_display("مُحَمَّدُ حُسَيْنِ مُغْنِيَّة"), S["center_sm"]))
    story.append(Paragraph("Muhammad Husain Mughniyah", ParagraphStyle(
        "covauth", parent=S["center_sm"], fontSize=9.5, textColor=GRAY)))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(shape_display("مُجَرَّبَاتُ الْإِمَامِيَّةِ"), ParagraphStyle(
        "covtitle", parent=S["center_ar"], fontSize=30, leading=42)))
    story.append(Paragraph(shape_display("فِي الشِّفَاءِ بِالْقُرْآنِ وَالدُّعَاءِ"), S["center_ar"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<i>Mujarrabât al-Imâmiyyah fî asy-Syifâ' bil-Qur'ân wad-Du'â'</i>",
                           ParagraphStyle("latinjudul", parent=S["center_sm"], fontSize=11, textColor=GRAY)))
    story.append(Paragraph("Kumpulan amalan teruji dari para Imam — penyembuhan dengan Al-Qur'an dan doa",
                           ParagraphStyle("artijudul", parent=S["center_sm"], fontSize=10, textColor=GRAY)))
    story.append(Spacer(1, 0.35 * cm))
    from reportlab.platypus import Image as _Img
    _img = _Img(os.path.join(HERE, "images", "sampul-ilustrasi.jpg"), width=8.4 * cm, height=11.25 * cm)
    _img.hAlign = "CENTER"
    story.append(_img)
    story.append(Spacer(1, 0.45 * cm))
    story.append(Paragraph(shape_display("مَنْشُورَاتُ مُؤَسَّسَةِ الْأَعْلَمِيِّ لِلْمَطْبُوعَاتِ — بَيْرُوتُ - لُبْنَان — ص.ب ٧١٢٠"), S["center_sm"]))
    story.append(Paragraph("Penerbit: Mu'assasat al-A'lami lil-Matbu'at, Beirut - Lebanon · Kotak Pos 7120",
                           ParagraphStyle("covpub", parent=S["center_sm"], fontSize=9.5, textColor=GRAY)))
    story.append(NextPageTemplate("main"))
    story.append(PageBreak())

    # ----- Halaman 2: HALAMAN JUDUL + terjemahan -----
    story.append(Spacer(1, 2.0 * cm))
    story.append(Paragraph(shape_display("مُجَرَّبَاتُ الْإِمَامِيَّةِ"), ParagraphStyle(
        "tj1", parent=S["center_ar"], fontSize=24, leading=34)))
    story.append(Paragraph(shape_display("فِي"), S["center_ar"]))
    story.append(Paragraph(shape_display("الشِّفَاءِ بِالْقُرْآنِ وَالدُّعَاءِ"), S["center_ar"]))
    story.append(Spacer(1, 1.0 * cm))
    story.append(Paragraph(shape_display("تَأْلِيفُ"), S["center_sm"]))
    story.append(Paragraph(shape_display("مُحَمَّدِ حُسَيْنِ مُغْنِيَّة"), S["center_sm"]))
    story.append(Spacer(1, 1.8 * cm))
    story.append(Paragraph(shape_display("مَنْشُورَاتُ مُؤَسَّسَةِ الْأَعْلَمِيِّ لِلْمَطْبُوعَاتِ"), S["center_sm"]))
    story.append(Paragraph(shape_display("بَيْرُوتُ - لُبْنَان — ص.ب ٧١٢٠"), S["center_sm"]))
    story.append(Spacer(1, 1.1 * cm))
    story.append(HRFlowable(width="70%", thickness=0.8, color=ACCENT, spaceBefore=2, spaceAfter=12))
    story.append(Paragraph("<b>Terjemahan halaman judul:</b> Mujarrabāt al-Imāmiyyah — kumpulan amalan yang teruji (mujarrab) dari para Imam Ahlulbait — tentang penyembuhan dengan Al-Qur'an dan doa. Penyusun: Muhammad Husain Mughniyah. Penerbit: Mu'assasat al-A'lami lil-Matbū'āt, Beirut - Lebanon, Kotak Pos 7120.", S["center_sm"]))
    story.append(PageBreak())

    # ----- Halaman 3: HALAMAN HAK CIPTA + terjemahan -----
    story.append(Spacer(1, 2.4 * cm))
    story.append(Paragraph(shape_display("الطَّبْعَةُ الْأُولَى"), S["center_sm"]))
    story.append(Paragraph(shape_display("جَمِيعُ الْحُقُوقِ مَحْفُوظَةٌ وَمُسَجَّلَةٌ لِلنَّاشِرِ"), S["center_sm"]))
    story.append(Paragraph(shape_display("١٤١٧هـ - ١٩٦م"), S["center_sm"]))
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("<b>Terjemahan:</b> Cetakan pertama. Seluruh hak cipta dilindungi dan terdaftar atas nama penerbit. 1417 H - 1996 M.", S["center_sm"]))
    story.append(Spacer(1, 1.6 * cm))
    story.append(Paragraph(shape_display("مُؤَسَّسَةُ الْأَعْلَمِيِّ لِلْمَطْبُوعَاتِ"), S["center_sm"]))
    story.append(Paragraph(shape_display("بَيْرُوتُ - شَارِعُ الْمَطَارِ - قُرْبَ كُلِّيَّةِ الْهَنْدَسَةِ"), S["center_sm"]))
    story.append(Paragraph(shape_display("ص.ب ٧١٠ — هَاتِف: ٨٣٢١٥٢ - ٨٣٢١٥٣"), S["center_sm"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("PUBLISHED BY Al Alami Library — BEIRUT - LEBANON — P.O. BOX 7120", S["center_sm"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Terjemahan:</b> Mu'assasat al-A'lami lil-Matbū'āt (Lembaga al-A'lami untuk Percetakan) - Beirut, Jalan Bandara, dekat Fakultas Teknik - Kotak Pos 7120 - Telepon 832152-832153. Diterbitkan oleh Al Alami Library, Beirut - Lebanon, P.O. Box 7120.", S["center_sm"]))
    story.append(Spacer(1, 1.8 * cm))
    story.append(Paragraph("Edisi rujukan terjemahan ini: Cetakan I Mu'assasat al-A'lami lil-Matbū'āt, Beirut 1417 H/1996 M (±432 halaman).", S["center_sm"]))
    story.append(PageBreak())

    story.append(Paragraph("Daftar Isi", ParagraphStyle("toctitle", fontName="DejaVu-Bold",
                         fontSize=16, leading=20, textColor=ACCENT, spaceAfter=10)))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle("toc0", fontName="DejaVu-Bold", fontSize=10.6, leading=15, leftIndent=2, spaceBefore=4),
        ParagraphStyle("toc1", fontName="DejaVu", fontSize=9.6, leading=13.5, leftIndent=16),
    ]
    story.append(toc)
    story.append(PageBreak())

    story += parse_md(SRC)
    doc.multiBuild(story)

if __name__ == "__main__":
    build()
    print("PDF jadi:", OUT, os.path.getsize(OUT), "bytes")
