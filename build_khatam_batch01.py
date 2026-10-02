#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build KHATAM_TERJEMAHAN_Mujarrabat_al_Imamiyyah.pdf dari TERJEMAHAN.md (Batch01).
Teks Arab RTL sempurna (reshaper + bidi + pemenggalan per kata), latin miring washal, Indonesia justify.
"""
import os, re, hashlib, html
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RlTTFont
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, HRFlowable, PageBreak
from reportlab.platypus.tableofcontents import TableOfContents

HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,"TERJEMAHAN.md")
OUT=os.path.join(HERE,"KHATAM_TERJEMAHAN_Mujarrabat_al_Imamiyyah.pdf")
FONTDIR=os.path.join(HERE,"terjemahan-mujarobat-imamiyyah","fonts")
# fallback font dir
if not os.path.exists(FONTDIR):
    FONTDIR=os.path.join(HERE,"fonts")

pdfmetrics.registerFont(RlTTFont("Amiri", os.path.join(FONTDIR,"AmiriMerged-Regular.ttf")))
pdfmetrics.registerFont(RlTTFont("Amiri-Bold", os.path.join(FONTDIR,"AmiriMerged-Bold.ttf")))
pdfmetrics.registerFont(RlTTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"))
pdfmetrics.registerFont(RlTTFont("DejaVuSerif-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"))

RE_AR=re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
RE_LATIN=re.compile(r'[A-Za-z]')
def has_arab(t): return bool(RE_AR.search(t))
def is_pure_arab(t): return has_arab(t) and not RE_LATIN.search(t)
def is_rtl_base(t):
    for ch in t:
        if RE_AR.match(ch): return True
        if ch.isalpha(): return False
    return False

_reshaper=arabic_reshaper.ArabicReshaper({'delete_harakat':False})
def shape(t): return _reshaper.reshape(t) if has_arab(t) else t
def shape_display(t): return get_display(shape(t)) if has_arab(t) else t

INK=colors.HexColor("#1a1a1a"); GRAY=colors.HexColor("#444444"); ACCENT=colors.HexColor("#0b5e3f")
S={}
S["h1"]=ParagraphStyle("h1",fontName="Amiri-Bold",fontSize=16.5,leading=24,textColor=ACCENT,spaceBefore=10,spaceAfter=10,alignment=TA_RIGHT)
S["h2"]=ParagraphStyle("h2",fontName="Amiri-Bold",fontSize=13.5,leading=20,textColor=colors.HexColor("#114a34"),spaceBefore=14,spaceAfter=6,alignment=TA_RIGHT)
S["h3"]=ParagraphStyle("h3",fontName="Amiri-Bold",fontSize=11.8,leading=18,textColor=INK,spaceBefore=10,spaceAfter=4,alignment=TA_RIGHT)
S["h4"]=ParagraphStyle("h4",fontName="Amiri-Bold",fontSize=10.5,leading=16,textColor=INK,spaceBefore=8,spaceAfter=4,alignment=TA_RIGHT)
S["body"]=ParagraphStyle("body",fontName="DejaVu",fontSize=10.0,leading=14.5,textColor=INK,alignment=TA_JUSTIFY,spaceAfter=5)
S["bodyar"]=ParagraphStyle("bodyar",fontName="Amiri",fontSize=11,leading=18,alignment=TA_RIGHT,spaceAfter=5)
S["quote_ar"]=ParagraphStyle("quote_ar",fontName="Amiri",fontSize=12.2,leading=20,textColor=INK,alignment=TA_RIGHT,leftIndent=10,rightIndent=2,spaceBefore=2,spaceAfter=2)
S["quote_lat"]=ParagraphStyle("quote_lat",fontName="DejaVu",fontSize=9.8,leading=14,textColor=colors.HexColor("#2a5a3a"),alignment=TA_JUSTIFY,leftIndent=16,rightIndent=8,spaceBefore=1,spaceAfter=3)
S["quote_id"]=ParagraphStyle("quote_id",fontName="DejaVuSerif",fontSize=9.8,leading=14.5,textColor=GRAY,alignment=TA_JUSTIFY,leftIndent=16,rightIndent=8,spaceBefore=1,spaceAfter=6)
S["center_ar"]=ParagraphStyle("center_ar",fontName="Amiri-Bold",fontSize=26,leading=40,alignment=TA_CENTER)
S["center_sm"]=ParagraphStyle("center_sm",fontName="DejaVu",fontSize=10,leading=14,alignment=TA_CENTER,textColor=GRAY)
FRAME_W=A4[0]-4*cm; PAGE_W,PAGE_H=A4

def clean_inline(t): return re.sub(r'\[([^\]]*)\]\([^)]*\)',r'\1',t)
def seg_split(t):
    t=re.sub(r'`([^`]*)`',r'\1',t); t=re.sub(r'\*([^\*\n]+)\*(?!\*)',r'\1',t)
    parts,pos,bold=[],0,False
    for m in re.finditer(r'\*\*',t):
        parts.append((bold,t[pos:m.start()])); bold=not bold; pos=m.end()
    parts.append((bold,t[pos:])); return [(b,s) for b,s in parts if s!=""]

def rtl_lines_xml(text,maxwidth,size,reg="Amiri",bold="Amiri-Bold",bullet=False):
    words=[]
    if bullet: words.append((False,"•"))
    for b,seg in seg_split(text):
        for w in seg.split():
            if w: words.append((b,w))
    widths=[]; space_w=stringWidth(" ",reg,size)
    for b,w in words:
        f=bold if b else reg; widths.append(stringWidth(shape(w),f,size))
    lines=[]; cur,cur_w=[],0.0
    for idx,w in enumerate(widths):
        add=w if not cur else cur_w+space_w+w
        if cur and add>maxwidth:
            lines.append(cur); cur,cur_w=[],0.0; add=w
        cur.append(idx); cur_w=add
    if cur: lines.append(cur)
    out=[]
    for ln in lines:
        segs=[]
        for idx in ln:
            b,w=words[idx]
            if segs and segs[-1][0]==b: segs[-1][1].append(w)
            else: segs.append((b,[w]))
        rendered=[]
        for b,ws in segs:
            disp=html.escape(get_display(_reshaper.reshape(" ".join(ws))),quote=False)
            rendered.append(f"<b>{disp}</b>" if b else disp)
        rendered.reverse(); out.append(" ".join(rendered))
    return out

def md_to_xml(text):
    text=clean_inline(text).strip()
    if not text: return None,"ltr"
    if is_pure_arab(text): return "__RTL__","rtl"
    if has_arab(text):
        segs=seg_split(text); rtl=is_rtl_base(text); rendered=[]
        for b,seg in segs:
            disp=html.escape(shape_display(seg),quote=False)
            rendered.append(f"<b>{disp}</b>" if b else disp)
        if rtl: rendered.reverse()
        return " ".join(rendered),"mix"
    t=re.sub(r'`([^`]*)`',r'\1',text); t=re.sub(r'\*\*([^*]+)\*\*','\x01\\1\x02',t); t=re.sub(r'\*([^\*\n]+)\*',r'\1',t)
    t=html.escape(t,quote=False); t=t.replace('\x01','<b>').replace('\x02','</b>'); return t,"ltr"

def rtl_paras(text,style,bullet=False):
    from reportlab.lib.styles import ParagraphStyle as _PS
    reg="Amiri-Bold" if "Bold" in style.fontName else "Amiri"; bold="Amiri-Bold"
    lines=rtl_lines_xml(text,FRAME_W-(style.leftIndent or 0)-(style.rightIndent or 0)-8,style.fontSize,reg=reg,bold=bold,bullet=bullet)
    tight=_PS("tight_"+style.name,parent=style,spaceBefore=0,spaceAfter=0)
    out=[Paragraph(ln,tight) for ln in lines]
    if style.spaceBefore: out.insert(0,Spacer(1,style.spaceBefore))
    if style.spaceAfter: out.append(Spacer(1,style.spaceAfter))
    return out

class DocTemplate(BaseDocTemplate):
    def afterFlowable(self,fl):
        if isinstance(fl,Paragraph):
            name=fl.style.name
            if name in ("h1","h2","h3","h4"):
                txt=fl.getPlainText().strip(); lvl={"h1":0,"h2":1,"h3":2,"h4":2}[name]
                key=hashlib.md5((txt+str(self.page)).encode()).hexdigest()[:10]
                self.canv.bookmarkPage(key); self.canv.addOutlineEntry(txt,key,lvl,closed=(lvl>0))
                if lvl<=1: self.notify("TOCEntry",(lvl,txt,self.page,key))

def on_page(canv,doc):
    canv.saveState()
    if doc.page>1:
        canv.setFont("DejaVu",8.5); canv.setFillColor(GRAY); canv.drawCentredString(PAGE_W/2,1.15*cm,f"— {doc.page} —")
        canv.setStrokeColor(colors.HexColor("#cccccc")); canv.setLineWidth(0.4); canv.line(2*cm,1.55*cm,PAGE_W-2*cm,1.55*cm)
    canv.restoreState()

# Parse BATCH_01 like structure
def parse_batch_to_story(path):
    import re
    story=[]
    txt=open(path,encoding="utf-8").read()
    lines=txt.split("\n")
    i=0; n=len(lines)
    # skip header until first HALAMAN PDF
    # We'll parse generically: headings # ## ### etc, and blocks
    # Blocks are: **[Teks Arab Asli]** then > arab, then **[Transliterasi ...]** then > latin, then **[Terjemahan Indonesia]** then > indo
    # Also direct headings
    while i<n:
        ln=lines[i]; s=ln.strip()
        if not s:
            i+=1; continue
        m=re.match(r'^(#{1,4})\s+(.*)$',s)
        if m:
            lvl=len(m.group(1)); title=clean_inline(m.group(2)).strip()
            stl=S["h1"] if lvl==1 else S["h2"] if lvl==2 else S["h3"] if lvl==3 else S["h4"]
            if lvl==1:
                story.append(PageBreak())
            if is_pure_arab(title):
                story.extend(rtl_paras(title,stl))
            else:
                xml,_=md_to_xml(title)
                if xml and xml!="__RTL__":
                    story.append(Paragraph(xml,stl))
                elif xml=="__RTL__":
                    story.extend(rtl_paras(title,stl))
            if lvl==1:
                story.append(HRFlowable(width="100%",thickness=1.1,color=ACCENT,spaceBefore=0,spaceAfter=8))
            i+=1; continue
        # block headers
        if s.startswith("**[Teks Arab Asli]**"):
            # next lines are quote arab until next block header
            i+=1
            # skip empty
            while i<n and lines[i].strip()=="": i+=1
            # label
            story.append(Paragraph("<b>[Teks Arab Asli]</b>", ParagraphStyle("lbl_ar",parent=S["body"],fontName="DejaVu-Bold",fontSize=8.5,textColor=ACCENT,spaceBefore=6,spaceAfter=2,alignment=TA_LEFT)))
            # collect arab quote lines starting with >
            arab_lines=[]
            while i<n:
                cur=lines[i]
                if cur.strip().startswith("**[Transliterasi"):
                    break
                if cur.strip().startswith(">"):
                    arab_lines.append(cur.lstrip(">").lstrip())
                elif cur.strip().startswith("**[Terjemahan"):
                    break
                elif cur.strip().startswith("##") or cur.strip().startswith("#"):
                    break
                elif cur.strip()=="" and arab_lines:
                    # keep paragraph break
                    arab_lines.append("")
                i+=1
                if i<n and lines[i].strip().startswith("**[Transliterasi"): break
                if i>=n: break
            # join arab lines into paragraphs
            paras=[]; cur=[]
            for ql in arab_lines:
                if ql.strip()=="":
                    if cur: paras.append(" ".join(cur)); cur=[]
                else: cur.append(ql.strip())
            if cur: paras.append(" ".join(cur))
            for p in paras:
                if p.strip():
                    if is_pure_arab(p):
                        story.extend(rtl_paras(p,S["quote_ar"]))
                    else:
                        # mixed arab/latin
                        xml,_=md_to_xml(p)
                        story.append(Paragraph(xml,S["quote_ar"] if is_rtl_base(p) else S["bodyar"]))
            continue
        if s.startswith("**[Transliterasi"):
            story.append(Paragraph("<b>[Transliterasi Latin Fonetik — 100% Washal Ulama]</b>", ParagraphStyle("lbl_lat",parent=S["body"],fontName="DejaVu-Bold",fontSize=8.5,textColor=colors.HexColor("#2a5a3a"),spaceBefore=4,spaceAfter=2,alignment=TA_LEFT)))
            i+=1
            while i<n and lines[i].strip()=="": i+=1
            lat_lines=[]
            while i<n:
                cur=lines[i]
                if cur.strip().startswith("**[Terjemahan"): break
                if cur.strip().startswith("**[Teks Arab"): break
                if cur.strip().startswith("#"): break
                if cur.strip().startswith(">"):
                    lat_lines.append(cur.lstrip(">").lstrip())
                elif cur.strip()!="" and not cur.strip().startswith(">") and lat_lines:
                    # continuation without >
                    lat_lines.append(cur.strip())
                elif cur.strip()=="":
                    if lat_lines: lat_lines.append("")
                i+=1
                if i<n and (lines[i].strip().startswith("**[Terjemahan") or lines[i].strip().startswith("**[Teks Arab") or lines[i].strip().startswith("#")): break
            paras=[]; cur=[]
            for ql in lat_lines:
                if ql.strip()=="":
                    if cur: paras.append(" ".join(cur)); cur=[]
                else: cur.append(ql.strip())
            if cur: paras.append(" ".join(cur))
            for p in paras:
                if p.strip():
                    # strip leading > markers like * *
                    clean=re.sub(r'^\*\s*','',p).strip()
                    clean=re.sub(r'\*\s*$','',clean).strip()
                    clean=re.sub(r'^\*','',clean).strip()
                    clean=re.sub(r'\*$','',clean).strip()
                    # italic: keep as is but remove surrounding *
                    # Already our style is oblique
                    xml,_=md_to_xml(clean)
                    # ensure italic: wrap
                    if xml and xml!="__RTL__":
                        # make italic by using oblique font already, but keep <i>
                        if not xml.startswith("<i>"):
                            xml=f"<i>{xml}</i>"
                        story.append(Paragraph(xml,S["quote_lat"]))
                    else:
                        story.append(Paragraph(xml or clean,S["quote_lat"]))
            continue
        if s.startswith("**[Terjemahan Indonesia]**"):
            story.append(Paragraph("<b>[Terjemahan Indonesia]</b>", ParagraphStyle("lbl_id",parent=S["body"],fontName="DejaVu-Bold",fontSize=8.5,textColor=GRAY,spaceBefore=4,spaceAfter=2,alignment=TA_LEFT)))
            i+=1
            while i<n and lines[i].strip()=="": i+=1
            id_lines=[]
            while i<n:
                cur=lines[i]
                if cur.strip().startswith("**[Teks Arab") or cur.strip().startswith("**[Transliterasi") or cur.strip().startswith("**[Terjemahan") or re.match(r'^#{1,4}\s',cur.strip()):
                    break
                if cur.strip().startswith(">"):
                    id_lines.append(cur.lstrip(">").lstrip())
                elif cur.strip().startswith("---"):
                    break
                elif cur.strip()!="" and id_lines:
                    id_lines.append(cur.strip())
                elif cur.strip()=="":
                    if id_lines: id_lines.append("")
                i+=1
                # peek next header
                if i<n and (lines[i].strip().startswith("**[Teks Arab") or lines[i].strip().startswith("**[Transliterasi") or lines[i].strip().startswith("**[Terjemahan") or re.match(r'^#{1,4}\s',lines[i].strip()) or lines[i].strip().startswith("---")):
                    break
            paras=[]; cur=[]
            for ql in id_lines:
                if ql.strip()=="":
                    if cur: paras.append(" ".join(cur)); cur=[]
                else: cur.append(ql.strip())
            if cur: paras.append(" ".join(cur))
            for p in paras:
                if p.strip():
                    xml,_=md_to_xml(p)
                    story.append(Paragraph(xml or p,S["quote_id"]))
            continue
        # separator
        if s.startswith("---"):
            story.append(Spacer(1,2)); story.append(HRFlowable(width="100%",thickness=0.6,color=colors.HexColor("#bbbbbb"),spaceBefore=4,spaceAfter=6)); i+=1; continue
        # blockquote generic
        if s.startswith(">"):
            # generic blockquote not captured above (notes)
            buf=[s.lstrip(">").lstrip()]
            while i+1<n and lines[i+1].strip().startswith(">"):
                i+=1; buf.append(lines[i].lstrip(">").lstrip())
            joined=" ".join(buf)
            xml,_=md_to_xml(joined)
            story.append(Paragraph(xml or joined,S["body"] if not has_arab(joined) else S["bodyar"]))
            i+=1; continue
        # generic paragraph
        buf=[s]
        while i+1<n:
            nxt=lines[i+1].strip()
            if nxt=="" or nxt.startswith("#") or nxt.startswith(">") or nxt.startswith("**[Teks") or nxt.startswith("**[Transliterasi") or nxt.startswith("**[Terjemahan") or nxt.startswith("---"): break
            buf.append(nxt); i+=1
        joined=" ".join(buf)
        if joined.strip():
            if is_pure_arab(joined):
                story.extend(rtl_paras(joined,S["bodyar"]))
            else:
                xml,_=md_to_xml(joined)
                story.append(Paragraph(xml or joined,S["bodyar"] if has_arab(joined) else S["body"]))
        i+=1
    return story

def build():
    doc=DocTemplate(OUT,pagesize=A4,leftMargin=2*cm,rightMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm,title="Mujarrabat - KHATAM Batch01",author="Mughniyah")
    frame=Frame(2*cm,1.8*cm,PAGE_W-4*cm,PAGE_H-3.6*cm,id="f")
    doc.addPageTemplates([PageTemplate(id="main",frames=[frame],onPage=on_page)])
    story=[]
    story.append(Spacer(1,0.4*cm))
    story.append(Paragraph(shape_display("مُجَرَّبَاتُ الْإِمَامِيَّةِ"),ParagraphStyle("cov_ar",parent=S["center_ar"],fontSize=30,leading=42)))
    story.append(Paragraph(shape_display("فِي الشِّفَاءِ بِالْقُرْآنِ وَالدُّعَاءِ"),S["center_ar"]))
    story.append(Spacer(1,6))
    story.append(Paragraph("<b>Mujarrabātu al-Imāmiyyah fī asy-Syifā'i bil-Qur'āni wad-Du'ā'i</b>",ParagraphStyle("cov_lat",parent=S["center_sm"],fontSize=11,textColor=GRAY)))
    story.append(Paragraph("KHATAM TERJEMAHAN — Batch 01 (PDF 1–5) — Sampul s.d. Daftar Isi<br/>Teks Arab RTL + Latin Washal 100% (miring) + Terjemahan Indonesia + Rajah 300 DPI",ParagraphStyle("cov_sub",parent=S["center_sm"],fontSize=9.5,textColor=GRAY)))
    story.append(Spacer(1,8))
    story.append(Paragraph("Edisi: Mu'assasat al-A'lamī 1417H — Terjemahan Lengkap Tanpa Ringkasan — Dibangun dari TERJEMAHAN.md",ParagraphStyle("cov_note",parent=S["center_sm"],fontSize=8.5,textColor=GRAY)))
    story.append(PageBreak())
    # TOC
    story.append(Paragraph("Daftar Isi (Otomatis)",ParagraphStyle("toc_title",fontName="DejaVu-Bold",fontSize=14,textColor=ACCENT,spaceAfter=10)))
    toc=TableOfContents()
    toc.levelStyles=[ParagraphStyle("toc0",fontName="DejaVu-Bold",fontSize=10,leading=14,leftIndent=2,spaceBefore=3),ParagraphStyle("toc1",fontName="DejaVu",fontSize=9,leading=12,leftIndent=16)]
    story.append(toc); story.append(PageBreak())
    # Content
    story+=parse_batch_to_story(SRC)
    doc.multiBuild(story)
    print(f"PDF jadi: {OUT} {os.path.getsize(OUT)} bytes")

if __name__=="__main__":
    build()
