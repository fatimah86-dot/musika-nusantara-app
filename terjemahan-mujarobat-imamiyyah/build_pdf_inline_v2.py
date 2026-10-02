#!/usr/bin/env python3
# PDF inline v2: tiap bab -> terjemahan -> langsung gambar asli wafq di bawahnya
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
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, HRFlowable, PageBreak, Image as RLImage
from reportlab.platypus.tableofcontents import TableOfContents

HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,"Mujarrabat-al-Imamiyyah-TERJEMAHAN-WAFQ-DI-BAWAH-ILMU.pdf")
FONTDIR=os.path.join(HERE,"fonts")
FULL_SCAN_DIR=os.path.join(HERE,"pindai-halaman-ASLI-FULL")

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
S["body"]=ParagraphStyle("body",fontName="DejaVu",fontSize=10.2,leading=15.2,textColor=INK,alignment=TA_JUSTIFY,spaceAfter=6)
S["bodyar"]=ParagraphStyle("bodyar",fontName="Amiri",fontSize=11,leading=18,alignment=TA_RIGHT,spaceAfter=6)
S["quote_ar"]=ParagraphStyle("quote_ar",fontName="Amiri",fontSize=12.6,leading=21,textColor=INK,alignment=TA_RIGHT,leftIndent=10,rightIndent=2,spaceBefore=2,spaceAfter=2)
S["quote_id"]=ParagraphStyle("quote_id",fontName="DejaVuSerif",fontSize=10.2,leading=15.5,textColor=GRAY,alignment=TA_JUSTIFY,leftIndent=16,rightIndent=8,spaceBefore=1,spaceAfter=6)
S["bullet"]=ParagraphStyle("bullet",parent=S["body"],leftIndent=16,bulletIndent=6,alignment=TA_LEFT,spaceAfter=3)
S["bullet_ar"]=ParagraphStyle("bullet_ar",parent=S["bodyar"],leftIndent=16,rightIndent=10,spaceAfter=3)
S["center_ar"]=ParagraphStyle("center_ar",fontName="Amiri-Bold",fontSize=27,leading=42,alignment=TA_CENTER)
S["center_sm"]=ParagraphStyle("center_sm",fontName="DejaVu",fontSize=10.5,leading=15,alignment=TA_CENTER,textColor=GRAY)
S["caption"]=ParagraphStyle("caption",fontName="DejaVu",fontSize=9,leading=12,alignment=TA_CENTER,textColor=GRAY,spaceBefore=2,spaceAfter=8)

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
    out_lines=[]
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
        rendered.reverse(); out_lines.append(" ".join(rendered))
    return out_lines

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

def avail(style): return FRAME_W-(style.leftIndent or 0)-(style.rightIndent or 0)-8

class DocTemplate(BaseDocTemplate):
    def afterFlowable(self,fl):
        if isinstance(fl,Paragraph):
            name=fl.style.name
            if name in ("h1","h2","h3"):
                txt=fl.getPlainText().strip(); lvl={"h1":0,"h2":1,"h3":2}[name]
                key=hashlib.md5((txt+str(self.page)).encode()).hexdigest()[:10]
                self.canv.bookmarkPage(key); self.canv.addOutlineEntry(txt,key,lvl,closed=(lvl>0))
                if lvl<=1: self.notify("TOCEntry",(lvl,txt,self.page,key))

def on_page(canv,doc):
    canv.saveState()
    if doc.page>1:
        canv.setFont("DejaVu",8.5); canv.setFillColor(GRAY); canv.drawCentredString(PAGE_W/2,1.15*cm,f"— {doc.page} —")
        canv.setStrokeColor(colors.HexColor("#cccccc")); canv.setLineWidth(0.4); canv.line(2*cm,1.55*cm,PAGE_W-2*cm,1.55*cm)
    canv.restoreState()

# Mapping Bab -> hal list (dari daftar 100+ halaman wafq)
BAB_WAFQ = {
    "mukadimah": [],
    "bab-01-istisyfa": [9,10,11,12,13,14],
    "bab-01-khasiat-riwayat": [14,15,16],
    "bab-01-khasiat-khawash": [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50],
    "bab-02-kesembuhan-umum": [51,52],
    "bab-02-demam": [53,54,55],
    "bab-02-kepala": [56,57,58,59,60,61,62,63,64],
    "bab-02-mata": [70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85],
    "bab-02-dada": [88,89,90,91,92,93,94,96,97],
    "bab-02-kulit": [98,99,100,101,102,103,104,105,106,107,108],
    "bab-02-bisa": [109,110,111,112,113,114,115,116,117,118,119,120,121,122,123],
    "bab-03-hamil": [124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141],
    "bab-05-ain": [142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163],
    "bab-06-sihir": [164,165,166,167,168,169,170,171,172],
    "bab-04-rezeki": [173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193],
    "bab-08-penjagaan": [194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258],
    "bab-09-musuh": [259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289],
    "bab-10-ahraz": [290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321],
    "bab-11-hajat": [322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338],
    "bab-12-mutafarriqah": [339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400],
}

def get_bab_key_from_title(title):
    t=title.lower()
    if "mukadimah" in t or "adab" in t: return "mukadimah"
    if "istisyfa" in t: return "bab-01-istisyfa"
    if "khasiat" in t and "riwayat" in t: return "bab-01-khasiat-riwayat"
    if "khawash" in t or "khasiat" in t and "kitab" in t: return "bab-01-khasiat-khawash"
    if "kesembuhan umum" in t: return "bab-02-kesembuhan-umum"
    if "demam" in t: return "bab-02-demam"
    if "kepala" in t or "syaqiqah" in t: return "bab-02-kepala"
    if "mata" in t or "telinga" in t or "gigi" in t: return "bab-02-mata"
    if "dada" in t or "punggung" in t or "perut" in t: return "bab-02-dada"
    if "kulit" in t or "tulang" in t: return "bab-02-kulit"
    if "bisa" in t or "racun" in t or "tidur" in t or "ayan" in t: return "bab-02-bisa"
    if "hamil" in t or "melahirkan" in t: return "bab-03-hamil"
    if "rezeki" in t or "utang" in t: return "bab-04-rezeki"
    if "ain" in t: return "bab-05-ain"
    if "sihir" in t: return "bab-06-sihir"
    if "pencuri" in t or "hilang" in t: return "bab-07-pencuri"
    if "penjagaan" in t or "safar" in t: return "bab-08-penjagaan"
    if "musuh" in t or "jin" in t: return "bab-09-musuh"
    if "ahraz" in t or "hijab" in t or "hirz" in t: return "bab-10-ahraz"
    if "hajat" in t or "karab" in t: return "bab-11-hajat"
    if "mutafarriqah" in t or "lain-lain" in t: return "bab-12-mutafarriqah"
    return None

def parse_combined_with_inline():
    # Gabungkan semua file 00-21 menjadi flow, tapi setelah tiap Bab, sisipkan gambar asli hal yang sesuai
    import glob
    files=sorted(glob.glob(os.path.join(HERE,"[0-2][0-9]-*.md")))
    core=[f for f in files if os.path.basename(f).startswith(("00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21"))]
    flow=[]
    for filepath in core:
        fname=os.path.basename(filepath)
        # baca file
        lines=open(filepath,encoding="utf-8").read().split("\n")
        # parse sederhana per file
        i=0; n=len(lines)
        quote_buf=[]; in_quote=False
        def flush_quote():
            nonlocal quote_buf,in_quote
            if not quote_buf: in_quote=False; return
            paras=[]; cur=[]
            for ql in quote_buf:
                if ql.strip()=="":
                    if cur: paras.append(" ".join(cur)); cur=[]
                else: cur.append(ql.strip())
            if cur: paras.append(" ".join(cur))
            for p in paras:
                if is_pure_arab(p): flow.extend(rtl_paras(p,S["quote_ar"]))
                elif has_arab(p):
                    xml,_=md_to_xml(p); flow.append(Paragraph(xml,S["quote_id"] if not is_rtl_base(p) else S["bodyar"]))
                else:
                    xml,_=md_to_xml(p); flow.append(Paragraph(xml,S["quote_id"]))
            flow.append(Spacer(1,4)); quote_buf=[]; in_quote=False

        while i<n:
            ln=lines[i]; stripped=ln.strip()
            if in_quote:
                if stripped.startswith(">"): quote_buf.append(stripped.lstrip(">").lstrip()); i+=1; continue
                flush_quote()
            if stripped=="": i+=1; continue
            if stripped.startswith("---"): flow.append(Spacer(1,4)); flow.append(HRFlowable(width="100%",thickness=0.6,color=colors.HexColor("#bbbbbb"),spaceBefore=4,spaceAfter=8)); i+=1; continue
            if stripped.startswith("<a id="): i+=1; continue
            m=re.match(r'^(#{1,4})\s+(.*)$',stripped)
            if m:
                level,text=len(m.group(1)),clean_inline(m.group(2)).strip()
                stl=S["h1"] if level==1 else S["h2"] if level==2 else S["h3"]
                if level==1: flow.append(PageBreak())
                if is_pure_arab(text): flow.extend(rtl_paras(text,stl))
                else:
                    xml,_=md_to_xml(text)
                    if xml: flow.append(Paragraph(xml,stl))
                if level==1: flow.append(HRFlowable(width="100%",thickness=1.1,color=ACCENT,spaceBefore=0,spaceAfter=8))
                # jika ini H1 (judul bab), setelah itu kita akan sisipkan gambar wafq untuk bab ini di akhir file nanti, tapi untuk sekarang lanjut
                i+=1; continue
            if stripped.startswith(">"): in_quote=True; quote_buf.append(stripped.lstrip(">").lstrip()); i+=1; continue
            if stripped.startswith("- "):
                text=clean_inline(stripped[2:]).strip()
                if is_pure_arab(text): flow.extend(rtl_paras(text,S["bullet_ar"],bullet=True))
                elif has_arab(text): xml,_=md_to_xml(text); flow.append(Paragraph(xml+" •",S["bullet_ar"]))
                else: xml,_=md_to_xml(text); flow.append(Paragraph(xml,S["bullet"],bulletText="•"))
                i+=1; continue
            buf=[stripped]
            while i+1<n:
                nxt=lines[i+1].strip()
                if (nxt=="" or nxt.startswith("#") or nxt.startswith(">") or nxt.startswith("- ") or nxt.startswith("---") or nxt.startswith("<a id=") or re.match(r'^\d+[.)]\s',nxt)): break
                buf.append(nxt); i+=1
            joined=" ".join(buf)
            if is_pure_arab(joined): flow.extend(rtl_paras(joined,S["bodyar"]))
            else:
                xml,_=md_to_xml(joined); flow.append(Paragraph(xml,S["bodyar"] if has_arab(joined) else S["body"]))
            i+=1
        flush_quote()
        # Setelah selesai satu file (satu bab), sisipkan gambar asli wafq untuk bab ini DI BAWAH keterangan ilmunya
        bab_key=get_bab_key_from_title(fname)
        # fallback: coba dari isi file pertama
        if not bab_key:
            # coba tebak dari nama file
            for k in BAB_WAFQ.keys():
                if k.split("-")[0] in fname or k.split("-")[-1] in fname:
                    bab_key=k; break
        # jika masih tidak ketemu, pakai mapping berdasarkan nomor file
        if not bab_key:
            # mapping nomor file ke bab
            num=int(fname.split("-")[0])
            mapping_num={0:"mukadimah",1:"bab-01-istisyfa",2:"bab-01-khasiat-riwayat",3:"bab-01-khasiat-khawash",4:"bab-02-kesembuhan-umum",5:"bab-02-demam",6:"bab-02-kepala",7:"bab-02-mata",8:"bab-02-dada",9:"bab-02-kulit",10:"bab-02-bisa",11:"bab-03-hamil",12:"bab-04-rezeki",13:"bab-05-ain",14:"bab-06-sihir",15:"bab-07-pencuri",16:"bab-08-penjagaan",17:"bab-09-musuh",18:"bab-10-ahraz",19:"bab-11-hajat",20:"bab-12-mutafarriqah"}
            bab_key=mapping_num.get(num)

        if bab_key and bab_key in BAB_WAFQ:
            hals=BAB_WAFQ[bab_key]
            # hanya ambil yang ada file gambar dan yang termasuk wafq (ada kotak)
            # untuk demo, ambil 5 pertama per bab biar tidak terlalu banyak, tapi user minta semua di bawah ilmu, jadi ambil semua yang ada di list wafq_pages utama
            # filter hanya yang ada di daftar wafq penting (100+)
            important_wafq=[53,54,55,56,57,58,62,63,64,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,88,89,90,91,92,93,94,96,97,109,124,142,164,173,174,175,176,177,181,182,183,184,185,186,187,188,189,190,191,194,197,198,199,200,201,202,203,205,207,211,212,213,214,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,259,261,268,272,273,290,291,303,305,307,309,311,322,329,339,351,359,370]
            hals_filtered=[h for h in hals if h in important_wafq]
            if hals_filtered:
                flow.append(Spacer(1,0.5*cm))
                flow.append(Paragraph(f"Gambar Asli Wafq/Rajah untuk {bab_key} — di bawah keterangan ilmu",S["h2"]))
                flow.append(Paragraph(f"Berikut adalah scan asli dari PDF 12MB untuk bab ini, ditaruh langsung di bawah keterangan ilmunya sesuai permintaan.",S["body"]))
                for hal in hals_filtered:
                    img_path=os.path.join(FULL_SCAN_DIR,f"hal-{hal:03d}.jpg")
                    if not os.path.exists(img_path): continue
                    flow.append(Spacer(1,0.3*cm))
                    flow.append(Paragraph(f"Hal {hal} — Scan Asli",S["h3"]))
                    try:
                        img=RLImage(img_path,width=15*cm,height=21*cm,kind='proportional')
                        img.hAlign="CENTER"
                        flow.append(img)
                        flow.append(Paragraph(f"↑ Gambar asli Hal {hal} — wafq/rajah dipertahankan persis, ditaruh di bawah ilmu {bab_key}",S["caption"]))
                    except Exception as e:
                        flow.append(Paragraph(f"[Gagal load Hal {hal}: {e}]",S["body"]))
                flow.append(PageBreak())
    return flow

def build():
    doc=DocTemplate(OUT,pagesize=A4,leftMargin=2*cm,rightMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm,title="Mujarrabat - Wafq di Bawah Ilmu",author="Mughniyah")
    frame=Frame(2*cm,1.8*cm,PAGE_W-4*cm,PAGE_H-3.6*cm,id="f")
    doc.addPageTemplates([PageTemplate(id="main",frames=[frame],onPage=on_page)])
    story=[]
    story.append(Spacer(1,0.6*cm))
    story.append(Paragraph(shape_display("مُجَرَّبَاتُ الْإِمَامِيَّةِ"),ParagraphStyle("covtitle",parent=S["center_ar"],fontSize=30,leading=42)))
    story.append(Paragraph(shape_display("فِي الشِّفَاءِ بِالْقُرْآنِ وَالدُّعَاءِ"),S["center_ar"]))
    story.append(Spacer(1,4))
    story.append(Paragraph("<b>Terjemahan Lengkap + Gambar Asli Wafq/Rajah DI BAWAH Keterangan Ilmunya</b>",ParagraphStyle("latinjudul",parent=S["center_sm"],fontSize=11,textColor=GRAY)))
    story.append(Paragraph("Setiap ilmu/bab: Arab berharokat + Latin + Arti + Tata Cara → langsung di bawahnya gambar asli wafq/rajah/thalasim dari PDF asli 12MB 432 hal (dipertahankan persis)",ParagraphStyle("artijudul",parent=S["center_sm"],fontSize=10,textColor=GRAY)))
    story.append(PageBreak())
    story.append(Paragraph("Daftar Isi",ParagraphStyle("toctitle",fontName="DejaVu-Bold",fontSize=16,leading=20,textColor=ACCENT,spaceAfter=10)))
    toc=TableOfContents()
    toc.levelStyles=[ParagraphStyle("toc0",fontName="DejaVu-Bold",fontSize=10.6,leading=15,leftIndent=2,spaceBefore=4),ParagraphStyle("toc1",fontName="DejaVu",fontSize=9.6,leading=13.5,leftIndent=16)]
    story.append(toc); story.append(PageBreak())
    flow=parse_combined_with_inline()
    story+=flow
    doc.multiBuild(story)
    print(f"PDF jadi: {OUT} {os.path.getsize(OUT)} bytes")

if __name__=="__main__":
    build()
