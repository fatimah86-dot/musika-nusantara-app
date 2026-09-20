#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bangun PDF dari Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.md
   Arab: reshaper + bidi, per-segmen bold; Latin: DejaVu."""
import re, hashlib, html
import arabic_reshaper
from bidi.algorithm import get_display
from fontTools.ttLib import TTFont  # noqa (pastikan font oke)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RlTTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, HRFlowable, PageBreak, Flowable, NextPageTemplate)
from reportlab.platypus.tableofcontents import TableOfContents

SRC = "/home/user/musika-nusantara-app/terjemahan-mujarobat-imamiyyah/Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.md"
OUT = "/home/user/musika-nusantara-app/terjemahan-mujarobat-imamiyyah/Mujarrabat-al-Imamiyyah-Terjemahan-Lengkap.pdf"
FONTDIR = "/home/user/fonts"

# ---------- registrasi font ----------
pdfmetrics.registerFont(RlTTFont("Amiri", f"{FONTDIR}/AmiriMerged-Regular.ttf"))
pdfmetrics.registerFont(RlTTFont("Amiri-Bold", f"{FONTDIR}/AmiriMerged-Bold.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"))
registerFontFamily("amiri", normal="Amiri", bold="Amiri-Bold", italic="Amiri", boldItalic="Amiri-Bold")
registerFontFamily("dv", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

RE_AR = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
def has_arab(t): return bool(RE_AR.search(t))
def is_rtl_base(t):
    for ch in t:
        if RE_AR.match(ch): return True
        if ch.isalpha(): return False
    return False

_reshaper = arabic_reshaper.ArabicReshaper({"configuration": {"delete_harakat": False}})
def shape_display(t):
    return get_display(_reshaper.reshape(t)) if has_arab(t) else t

# ---------- gaya ----------
INK = colors.HexColor("#1a1a1a")
GRAY = colors.HexColor("#444444")
ACCENT = colors.HexColor("#0b5e3f")

S = {}
S["h1"] = ParagraphStyle("h1", fontName="Amiri-Bold", fontSize=16.5, leading=23,
                         textColor=ACCENT, spaceBefore=10, spaceAfter=10)
S["h2"] = ParagraphStyle("h2", fontName="Amiri-Bold", fontSize=13.5, leading=19,
                         textColor=colors.HexColor("#114a34"), spaceBefore=14, spaceAfter=6)
S["h3"] = ParagraphStyle("h3", fontName="Amiri-Bold", fontSize=11.8, leading=17,
                         textColor=INK, spaceBefore=10, spaceAfter=4)
S["body"] = ParagraphStyle("body", fontName="DejaVu", fontSize=10.2, leading=15.2,
                           textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6)
S["bodyar"] = ParagraphStyle("bodyar", parent=S["body"], fontName="Amiri", fontSize=11,
                             leading=18, alignment=TA_RIGHT)
S["quote_ar"] = ParagraphStyle("quote_ar", fontName="Amiri", fontSize=12.6, leading=21,
                               textColor=INK, alignment=TA_RIGHT, leftIndent=10, rightIndent=2,
                               spaceBefore=2, spaceAfter=2, borderPadding=0)
S["quote_id"] = ParagraphStyle("quote_id", fontName="DejaVuSerif", fontSize=10.2, leading=15.5,
                               textColor=GRAY, alignment=TA_JUSTIFY, leftIndent=16, rightIndent=8,
                               spaceBefore=1, spaceAfter=6)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=16, bulletIndent=6,
                             alignment=TA_LEFT, spaceAfter=3)
S["bullet_ar"] = ParagraphStyle("bullet_ar", parent=S["bodyar"], leftIndent=16, rightIndent=10,
                                spaceAfter=3)
S["center_ar"] = ParagraphStyle("center_ar", fontName="Amiri-Bold", fontSize=27, leading=40,
                                alignment=TA_CENTER, textColor=ACCENT)
S["center_id"] = ParagraphStyle("center_id", fontName="DejaVu-Bold", fontSize=17, leading=24,
                                alignment=TA_CENTER, textColor=INK)
S["center_sm"] = ParagraphStyle("center_sm", fontName="DejaVu", fontSize=10.5, leading=15,
                                alignment=TA_CENTER, textColor=GRAY)

# ---------- markup ----------
def clean_inline(t):
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t)      # sisa link -> label
    return t

def seg_split(t):
    """Pecah jadi segmen (bold?, teks); buang *italic tunggal, tangani **bold**."""
    t = re.sub(r'`([^`]*)`', r'\1', t)
    t = re.sub(r'\*([^*\n]+)\*(?!\*)', r'\1', t)          # italic -> polos
    parts, pos, bold = [], 0, False
    for m in re.finditer(r'\*\*', t):
        parts.append((bold, t[pos:m.start()]))
        bold = not bold
        pos = m.end()
    parts.append((bold, t[pos:]))
    return [(b, s) for b, s in parts if s != ""]

def md_paragraph_xml(text):
    """Teks mentah md -> XML Paragraph siap render (arab: reshape+bidi per segmen)."""
    text = clean_inline(text).strip()
    if not text: return None
    segs = seg_split(text)
    rtl = is_rtl_base(text)
    rendered = []
    for bold, seg in segs:
        disp = shape_display(seg)
        disp = html.escape(disp, quote=False)
        rendered.append(f"<b>{disp}</b>" if bold else disp)
    if rtl: rendered.reverse()
    return " ".join(rendered)

# ---------- flowables ----------
class Anchor(Flowable):
    def __init__(self, key, title, level):
        Flowable.__init__(self); self.key, self.title, self.level = key, title, level
        self.width, self.height = 0, 0
    def wrap(self, *a): return (0, 0)
    def draw(self):
        self.canv.bookmarkPage(self.key)
        self.canv.addOutlineEntry(self.title, self.key, self.level, closed=(self.level > 0))

class DocTemplate(BaseDocTemplate):
    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph):
            name = fl.style.name
            if name in ("h1", "h2", "h3"):
                txt = re.sub(r'<[^>]+>', '', fl.getPlainText()).strip()
                txt = shape_display(txt) if has_arab(txt) else txt
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

# ---------- parser ----------
def parse_md(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    # mulai dari akhir blok daftar isi md (anchor pertama <a id="mukadimah">)
    start = 0
    for i, ln in enumerate(lines):
        if '<a id="mukadimah">' in ln: start = i; break
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
            xml = md_paragraph_xml(p)
            if not xml: continue
            flow.append(Paragraph(xml, S["quote_ar"] if has_arab(p) else S["quote_id"]))
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
            # jangan i+=; proses baris ini normal

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
            xml = md_paragraph_xml(text)
            if xml:
                if level == 1: flow.append(PageBreak())
                stl = S["h1"] if level == 1 else S["h2"] if level == 2 else S["h3"]
                flow.append(Paragraph(xml, stl))
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
            xml = md_paragraph_xml(text)
            if xml:
                if has_arab(text):
                    flow.append(Paragraph(xml + " •", S["bullet_ar"]))
                else:
                    flow.append(Paragraph(xml, S["bullet"], bulletText="•"))
            i += 1; continue

        mnum = re.match(r'^(\d+)[.)]\s+(.*)$', stripped)
        if mnum:
            text = f"{mnum.group(1)}. {clean_inline(mnum.group(2)).strip()}"
            xml = md_paragraph_xml(text)
            if xml:
                flow.append(Paragraph(xml, S["bodyar"] if has_arab(text) else S["body"]))
            i += 1; continue

        # paragraf biasa (mungkin berlanjut beberapa baris)
        buf = [stripped]
        while i + 1 < n:
            nxt = lines[i + 1].strip()
            if (nxt == "" or nxt.startswith("#") or nxt.startswith(">") or
                    nxt.startswith("- ") or nxt.startswith("---") or nxt.startswith("<a id=")
                    or re.match(r'^\d+[.)]\s', nxt)):
                break
            buf.append(nxt); i += 1
        xml = md_paragraph_xml(" ".join(buf))
        if xml:
            flow.append(Paragraph(xml, S["bodyar"] if has_arab(" ".join(buf)) else S["body"]))
        i += 1
    flush_quote()
    return flow

# ---------- rakit dokumen ----------
def build():
    doc = DocTemplate(OUT, pagesize=A4,
                      leftMargin=2 * cm, rightMargin=2 * cm,
                      topMargin=2 * cm, bottomMargin=2 * cm,
                      title="Mujarrabat al-Imamiyyah fi as-Syifa' bil-Qur'an wad-Du'a' — Terjemahan Lengkap",
                      author="Muhammad Husain Mughniyah",
                      subject="Terjemahan Indonesia lengkap 12 bab")
    frame = Frame(2 * cm, 1.8 * cm, PAGE_W - 4 * cm, PAGE_H - 3.6 * cm, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])

    story = []
    # --- sampul ---
    story.append(Spacer(1, 3.2 * cm))
    story.append(Paragraph(shape_display("مُجَرَّبَاتُ الْإِمَامِيَّةِ"), S["center_ar"]))
    story.append(Paragraph(shape_display("فِي الشِّفَاءِ بِالْقُرْآنِ وَالدُّعَاءِ"), S["center_ar"]))
    story.append(Spacer(1, 1.1 * cm))
    story.append(HRFlowable(width="55%", thickness=1.2, color=ACCENT, spaceBefore=2, spaceAfter=14))
    story.append(Paragraph("MUJARRABAT AL-IMAMIYYAH", S["center_id"]))
    story.append(Paragraph("Terjemahan Lengkap Bahasa Indonesia", ParagraphStyle(
        "sub", parent=S["center_id"], fontSize=13, leading=18, textColor=GRAY)))
    story.append(Spacer(1, 1.6 * cm))
    story.append(Paragraph("Karya: <b>Muhammad Husain Mughniyah</b> (محمد حسين مغنية)", S["center_sm"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Edisi rujukan: Cetakan Dâr al-'Ilmi lil-Malâyîn, Beirut (±432 halaman)", S["center_sm"]))
    story.append(Spacer(1, 2.2 * cm))
    story.append(Paragraph("Mukadimah · Bab 1–12 · Fihrist · Rangkuman Berhuruf Latin", S["center_sm"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Untuk sakit jasmani, ikhtiar medis tetap didahulukan; doa dan wirid adalah ikhtiar ruhani yang menyertainya.", S["center_sm"]))
    story.append(NextPageTemplate("main"))
    story.append(PageBreak())

    # --- daftar isi (otomatis, dgn nomor halaman) ---
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
    import os
    print("PDF jadi:", OUT, os.path.getsize(OUT), "bytes")
