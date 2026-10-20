/**
 * NaskahEngine - mesin teks Arab untuk Garshuni Studio "Arena Edition"
 * (murni JS, tanpa dependensi; dipakai index.html dan uji Node).
 *
 * Isi:
 *  1. stripDiacritics / skeleton / canonMarks / levenshtein / similarity -> penjaga mutu AI
 *  2. transliterate(text, mode) -> Latin sadar TIGA HUKUM WASHAL pengucapan:
 *       Hukum 1  Ta Marbuthah   (ة): washal -> "t", waqaf -> "h"
 *       Hukum 2  Hamzatul Washl (ا di awal kata): gugur saat menyambung,
 *                dibaca i/a/u saat memulai kalimat
 *       Hukum 3  Idgham Al-Lam  (ال): 14 huruf syamsiyah melebur (ar-, asy-, ...),
 *                qamariyah tetap "al-"; tanwin bersambung ke artikel (fashlul-islaami)
 *  3. localHarokat()  -> kamus harokat offline per kata (tahan beda hamzah/ta,
 *     awalan tergabung; bukan regex \b yang buta huruf Arab)
 *  4. localSyarah()   -> syarah offline: arti per kata dari kamus mufradat kitab
 *  5. fallback terjemahan yang JUJUR (tidak mengarang untuk sembarang teks)
 */
(function (factory) {
  // UMD: aman di browser (script klasik), Node CJS, maupun Node yang memuatnya
  // sebagai ESM (require() modern) — selalu tersedia di globalThis + module.exports.
  var api = factory();
  var g = (typeof globalThis !== 'undefined' && globalThis)
        || (typeof self !== 'undefined' && self)
        || (typeof window !== 'undefined' && window)
        || null;
  if (g) g.NaskahEngine = api;
  try {
    if (typeof module === 'object' && module && module.exports) module.exports = api;
  } catch (e) { /* lingkungan ESM tanpa module */ }
})(function () {
  'use strict';

  // ---------- karakter dasar ----------
  var FATHAH = '\u064E', KASRAH = '\u0650', DHAMMAH = '\u064F';
  var FATHATAN = '\u064B', KASRATAN = '\u064D', DHAMMATAN = '\u064C';
  var SUPER_ALEF = '\u0670', SHADDA = '\u0651', SUKUN = '\u0652';
  var ALEF = '\u0627', LAM = '\u0644', WAW = '\u0648', YA = '\u064A', YA_MAQ = '\u0649';
  var TA_MARB = '\u0629', AIN = '\u0639';
  var HAMZA = '\u0621', A_HAMZA = '\u0623', I_HAMZA = '\u0625', A_MADDA = '\u0622';
  var U_HAMZA = '\u0624', Y_HAMZA = '\u0626', A_WASLA = '\u0671';

  var SUN = {}; // huruf syamsiyah -> idgham "ال"
  '\u062A\u062B\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0644\u0646'
    .split('').forEach(function (c) { SUN[c] = true; });

  var HAMZA_CARRIERS = {}; [A_HAMZA, I_HAMZA, U_HAMZA, Y_HAMZA].forEach(function (c) { HAMZA_CARRIERS[c] = true; });

  var VOW = {}; VOW[FATHAH] = 'a'; VOW[KASRAH] = 'i'; VOW[DHAMMAH] = 'u';
  VOW[FATHATAN] = 'an'; VOW[KASRATAN] = 'in'; VOW[DHAMMATAN] = 'un'; VOW[SUPER_ALEF] = 'aa';

  var IGNORED = {};
  ('\u0653\u0654\u0655\u0656\u0657\u0658\u0659\u065A\u065B\u065C\u065D\u065E\u065F' +
    '\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB\u06DC\u06DF\u06E0\u06E1\u06E2\u06E3\u06E4' +
    '\u06E7\u06E8\u06EA\u06EB\u06EC\u06ED\u0640')
    .split('').forEach(function (c) { IGNORED[c] = true; });

  var LETTERS = {};
  (function () {
    var pairs = [
      ['\u0628', 'b'], ['\u062A', 't'], ['\u062B', 'ts'], ['\u062C', 'j'], ['\u062D', 'h'],
      ['\u062E', 'kh'], ['\u062F', 'd'], ['\u0630', 'dz'], ['\u0631', 'r'], ['\u0632', 'z'],
      ['\u0633', 's'], ['\u0634', 'sy'], ['\u0635', 'sh'], ['\u0636', 'dh'], ['\u0637', 'th'],
      ['\u0638', 'zh'], [AIN, '\u2018'], ['\u063A', 'gh'], ['\u0641', 'f'], ['\u0642', 'q'],
      ['\u0643', 'k'], [LAM, 'l'], ['\u0645', 'm'], ['\u0646', 'n'], ['\u0647', 'h'],
      [WAW, 'w'], [YA, 'y'], [YA_MAQ, 'aa'], [ALEF, 'a'], [A_WASLA, 'a'], [HAMZA, "'"],
      ['\u06A4', 'p'], ['\u067E', 'p'], ['\u06A0', 'ng'], ['\u06AC', 'ng'], ['\u06AE', 'g'],
      ['\u0762', 'g'], ['\u0686', 'c'], ['\u0683', 'j'], ['\u06BD', 'ny'], ['\u06CF', 'v'],
      ['\u06BB', 'n'], ['\u06CC', 'y'], ['\u06D2', 'e'], ['\u06BE', 'h'], ['\u06A9', 'k'],
      ['\u06AF', 'g'], ['\u0681', 'z']
    ];
    pairs.forEach(function (p) { LETTERS[p[0]] = p[1]; });
  })();

  var SPECIAL = {};
  SPECIAL['\u0627\u0644\u0644\u0647'] = 'Allaah';   // الله
  SPECIAL['\u0644\u0644\u0647'] = 'Lillaah';        // لله
  SPECIAL['\u0628\u0627\u0644\u0644\u0647'] = 'Billaah';
  SPECIAL['\u0648\u0627\u0644\u0644\u0647'] = 'Wallaah';

  // ---------- util dasar ----------
  function isHarakat(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x064B && c <= 0x065F) || c === 0x0670 ||
      (c >= 0x06D6 && c <= 0x06DC) || (c >= 0x06DF && c <= 0x06E4) ||
      c === 0x06E7 || c === 0x06E8 || (c >= 0x06EA && c <= 0x06ED);
  }

  function isArabicChar(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) ||
      (c >= 0x08A0 && c <= 0x08FF) || (c >= 0xFB50 && c <= 0xFDFF) ||
      (c >= 0xFE70 && c <= 0xFEFF);
  }

  function stripDiacritics(text) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (VOW[ch] || ch === SHADDA || ch === SUKUN || IGNORED[ch]) continue;
      out += ch;
    }
    return out;
  }

  /** Kerangka huruf (tanpa tasykil; varian disamakan) untuk pembandingan kesetiaan. */
  function skeleton(text) {
    var fold = {};
    fold[A_HAMZA] = ALEF; fold[I_HAMZA] = ALEF; fold[A_MADDA] = ALEF; fold[A_WASLA] = ALEF;
    fold[YA_MAQ] = YA; fold['\u06CC'] = YA; fold[TA_MARB] = '\u0647';
    fold[U_HAMZA] = WAW; fold[Y_HAMZA] = YA; fold['\u06A9'] = '\u0643';
    var stripped = stripDiacritics(text);
    var out = '';
    for (var i = 0; i < stripped.length; i++) {
      var ch = stripped[i];
      if (/\s/.test(ch)) continue;
      if (!isArabicChar(ch) && !/[A-Za-z0-9]/.test(ch)) continue;
      out += fold[ch] || ch;
    }
    return out;
  }

  /**
   * Kanonikasi urutan tanda tasykil (shadda/fathah/dst.) dalam satu gugus huruf,
   * sehingga dua penulisan yang hanya beda urutan tanda dianggap sama.
   */
  function canonMarks(text) {
    return String(text == null ? '' : text).normalize('NFC')
      .replace(/[\u064B-\u0655\u0670\u06D6-\u06ED]+/g, function (m) {
        return m.split('').sort().join('');
      });
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = new Array(b.length + 1);
    var curr = new Array(b.length + 1);
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var cost = a[i - 1] === b[k - 1] ? 0 : 1;
        curr[k] = Math.min(prev[k] + 1, curr[k - 1] + 1, prev[k - 1] + cost);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[b.length];
  }

  /** Skor kemiripan 0..1 antara teks asli (gundul) dan hasil berharokat. */
  function similarity(original, vocalized) {
    var a = skeleton(original), b = skeleton(vocalized);
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    if (a === b) return 1;
    a = a.slice(0, 4000); b = b.slice(0, 4000);
    return Math.max(0, Math.min(1, 1 - levenshtein(a, b) / Math.max(a.length, b.length)));
  }

  /** True bila hasil harokat AI masih setia pada huruf asli. */
  function isFaithful(original, vocalized, threshold) {
    return similarity(original, vocalized) >= (threshold || 0.72);
  }

  // ---------- pemindai tasykil ----------
  function scan(chars, start) {
    var j = start, vowel = '', shadda = false, sukun = false;
    while (j < chars.length) {
      var c = chars[j];
      if (c === SHADDA) { shadda = true; j++; continue; }
      if (c === SUKUN) { sukun = true; j++; continue; }
      if (IGNORED[c]) { j++; continue; }
      if (VOW[c]) {
        if (c === SUPER_ALEF || !vowel) vowel = VOW[c];
        j++; continue;
      }
      return { vowel: vowel, shadda: shadda, sukun: sukun, nextIndex: j };
    }
    return { vowel: vowel, shadda: shadda, sukun: sukun, nextIndex: j };
  }

  function trailingVowel(chars) {
    for (var k = chars.length - 1; k >= 0; k--) {
      var c = chars[k];
      if (VOW[c]) {
        var v = VOW[c];
        return (v === 'a' || v === 'i' || v === 'u') ? v : '';
      }
      if (c === SHADDA || c === SUKUN || IGNORED[c]) continue;
      return '';
    }
    return '';
  }

  // ---------- transliterasi satu kata (sadar 3 hukum washal) ----------

  // Kata ber-hamzatul washl non-artikel (ibnu, ismu, istaf'ala, ...).
  // Kaidah: hamzatul washl dibaca kasrah ("i") untuk ism & fi'il madhi;
  // fathah/dammah hanya untuk fi'il amr (perlu konteks — default "i").

  function isWaslWord(chars) {
    return chars.length > 1 && (chars[0] === ALEF || chars[0] === A_WASLA) && chars[1] !== LAM;
  }

  function waslStartVowel() {
    return 'i';
  }

  /**
   * @param word        satu kata Arab (idealnya berharokat)
   * @param mode        'washal' (default) | 'waqaf'
   * @param sentenceStart  true bila kata ini memulai kalimat
   * @param sentenceEnd    true bila kata ini mengakhiri kalimat (titik waqaf)
   * @return { text, waslDropped }
   */
  function transliterateWord(word, mode, sentenceStart, sentenceEnd) {
    mode = mode === 'waqaf' ? 'waqaf' : 'washal';
    var waqafHere = (mode === 'waqaf' && sentenceEnd); // hukum waqaf hanya di titik berhenti
    var chars = word.split('');
    var skel = stripDiacritics(word);
    var waslDropped = false;

    if (SPECIAL[skel]) return { text: SPECIAL[skel] + trailingVowel(chars), waslDropped: false };

    // --- Hukum 2: hamzatul washl non-artikel ---
    if (isWaslWord(chars)) {
      // tanda harokat yang menempel pada alif ikut digugurkan/diambil
      while (chars.length > 1 && (IGNORED[chars[1]] || VOW[chars[1]] || chars[1] === SHADDA || chars[1] === SUKUN)) {
        chars.splice(1, 1);
      }
      if (!sentenceStart) {
        waslDropped = true;
        chars = chars.slice(1); // alif gugur saat menyambung (washal)
      } else {
        var wv = waslStartVowel(skel);
        chars = chars.slice(1);
        var rest = transliterateWord(chars.join(''), mode, false, sentenceEnd).text;
        return { text: wv + rest, waslDropped: false };
      }
    }

    var out = [];
    var i = 0, lastVowel = '', assimilated = false;

    // artikel "ال" di awal kata (Hukum 3: idgham al-lam ditangani di bawah)
    if (chars.length > 2 && chars[0] === ALEF && chars[1] === LAM) {
      var lam = scan(chars, 2);
      if (lam.shadda) {
        out.push('all' + (lam.vowel || ''));
        lastVowel = lam.vowel || lastVowel;
        i = lam.nextIndex;
      } else if (lam.nextIndex < chars.length) {
        var nl = chars[lam.nextIndex];
        var nlT = scan(chars, lam.nextIndex + 1);
        if (!lam.vowel && nlT.shadda && SUN[nl]) {
          out.push('a');
          assimilated = true; // idgham syamsiyah: ar-, asy-, ath-, ...
        } else {
          out.push('al-');
        }
        i = lam.nextIndex;
      }
    }

    while (i < chars.length) {
      var ch = chars[i];
      if (IGNORED[ch] || ch === SHADDA || ch === SUKUN) { i++; continue; }
      if (VOW[ch]) { out.push(VOW[ch]); lastVowel = VOW[ch]; i++; continue; }

      var t = scan(chars, i + 1);
      var next = t.nextIndex < chars.length ? chars[t.nextIndex] : null;
      var consumed = t.nextIndex;
      var vowel = t.vowel;
      var base;

      if (ch === TA_MARB) {
        // --- Hukum 1: ta marbuthah — washal "t", waqaf "h" di titik berhenti ---
        base = waqafHere ? 'h' : 't';
      } else if (ch === A_HAMZA || ch === I_HAMZA || ch === A_WASLA) {
        base = vowel ? '' : (ch === I_HAMZA ? 'i' : 'a');
      } else if (ch === A_MADDA) {
        base = 'aa';
      } else if (ch === U_HAMZA || ch === Y_HAMZA) {
        base = (vowel || t.sukun || t.shadda) ? "'" : (ch === U_HAMZA ? 'u' : 'i');
      } else if (ch === YA && t.sukun && !vowel &&
        (lastVowel === 'a' || lastVowel === 'i') && next !== ALEF && next !== TA_MARB) {
        base = 'i';
      } else if (ch === WAW && t.sukun && !vowel &&
        (lastVowel === 'u' || lastVowel === 'a') && next !== ALEF) {
        base = 'u';
      } else if (LETTERS[ch]) {
        base = LETTERS[ch];
      } else if (/[A-Za-z0-9]/.test(ch) || '.,:;!?-\'"()\u060C\u061B\u061F\u06D4'.indexOf(ch) >= 0) {
        out.push(ch); i++; continue;
      } else {
        i++; continue;
      }

      // tasydid: huruf ganda; setelah idgham syamsiyah pakai tanda hubung
      if (t.shadda) {
        out.push(base + (assimilated ? '-' : ''));
      }
      out.push(base);
      assimilated = false;

      // vokal panjang: harokat + huruf mad yang tidak berharokat sendiri
      var nxt = consumed < chars.length ? scan(chars, consumed + 1) : { vowel: '', shadda: false, nextIndex: consumed };
      if ((vowel === 'a' || vowel === 'an') && (next === ALEF || next === YA_MAQ) && !nxt.shadda) {
        vowel = 'aa'; consumed = nxt.nextIndex;
      } else if (vowel === 'u' && next === WAW && !nxt.vowel && !nxt.shadda) {
        vowel = 'uu'; consumed = nxt.nextIndex;
      } else if (vowel === 'i' && (next === YA || next === YA_MAQ) && !nxt.vowel && !nxt.shadda) {
        vowel = 'ii'; consumed = nxt.nextIndex;
      }

      out.push(vowel);
      if (vowel) lastVowel = vowel;

      if (ch === WAW && vowel === 'a' && next && HAMZA_CARRIERS[next]) out.push('-');

      i = consumed;
    }

    var s = out.join('');
    // mode waqaf di titik berhenti: tanwin akhir kata digugurkan
    if (waqafHere) {
      s = s.replace(/(an|in|un)$/, '');
    }
    return { text: s, waslDropped: waslDropped };
  }

  /**
   * Transliterasi teks Arab -> Latin mengikuti 3 hukum washal (mode 'washal')
   * atau bacaan waqaf (mode 'waqaf'). Konvensi pesantren Indonesia:
   * sy, sh, th, kh, ‘, diftong ai/au.
   */
  function transliterate(text, mode) {
    if (!text) return '';
    mode = mode === 'waqaf' ? 'waqaf' : 'washal';
    var raw = String(text).split(/(\s+)/);
    var words = []; // { t, sentenceEnd }
    for (var i = 0; i < raw.length; i++) {
      var tok = raw[i];
      if (!tok) continue;
      if (/^\s+$/.test(tok)) {
        if (tok.indexOf('\n') >= 0 && words.length) words[words.length - 1].sentenceEnd = true;
        continue;
      }
      words.push({ t: tok, sentenceEnd: /[.؟!\u06D4]/.test(tok) });
    }
    if (words.length) words[words.length - 1].sentenceEnd = true;

    var parts = []; // { t, wasl }
    var sentenceStart = true;
    for (var i = 0; i < words.length; i++) {
      var r = transliterateWord(words[i].t, mode, sentenceStart, !!words[i].sentenceEnd);
      parts.push({ t: r.text, wasl: r.waslDropped });
      sentenceStart = !!words[i].sentenceEnd;
    }

    var s = '';
    for (var i = 0; i < parts.length; i++) {
      if (i === 0) s = parts[i].t;
      else if (parts[i].wasl) s += '-' + parts[i].t; // Hukum 2: sambungan washal
      else s += ' ' + parts[i].t;
    }
    s = s
      .replace(/[ \t]+/g, ' ')
      .replace(/ ([,.:;!?])/g, '$1');
    // Hukum 3 (lanjutan): sambungan tanwin + artikel — "fashlun al-islaami" -> "fashlul-islaami"
    s = s.replace(/([aiu])n (al?-)/g, '$1l-');
    return s.trim();
  }

  /** Tiga hukum washal untuk ditampilkan di UI. */
  var WASHAL_RULES = [
    {
      no: 1,
      nama: 'Ta Marbuthah (\u0629)',
      penjelasan: 'Ta marbuthah dibaca "t" bila bacaan disambung (washal), dan dibaca "h" bila berhenti (waqaf).',
      contoh: '\u062E\u064E\u0645\u0652\u0633\u064E\u0629\u064C',
      washal: 'khamsatun',
      waqaf: 'khamsah',
    },
    {
      no: 2,
      nama: 'Hamzatul Washl (\u0627\u0652 di awal kata)',
      penjelasan: 'Alif di awal kata (seperti pada اِسْم، اِبْن، اِسْتَفْعَلَ) gugur saat menyambung ke kata sebelumnya, dan dibaca i/a/u bila memulai bacaan.',
      contoh: '\u0639\u064E\u0644\u064E\u0649 \u0627\u0628\u0652\u0646\u0650\u0647\u0650',
      washal: '‘alaa-bnihi',
      waqaf: '‘alaa (berhenti) ibnihi',
    },
    {
      no: 3,
      nama: 'Idgham Al-Lam (\u0627\u0644)',
      penjelasan: 'Lam pada artikel "al" melebur ke 14 huruf syamsiyah (ditulis ar-, asy-, ath-, dst. dengan tanda hubung); pada huruf qamariyah tetap "al-". Tanwin pun melebur bersambung ke artikel berikutnya.',
      contoh: '\u0641\u064E\u0635\u0652\u0644\u064C \u0627\u0644\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645\u0650 ... \u0627\u0644\u0634\u0651\u064E\u0645\u0652\u0633\u064F',
      washal: 'fashlul-islaami ... asy-syamsu',
      waqaf: 'fashlul-islaami ... asy-syamsu',
    },
  ];

  // ---------- kamus harokat lokal (berbasis kata, bukan regex \b) ----------
  var HARAKAT_PHRASES = [
    ['\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645',
      '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'],
    ['\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 \u0631\u0628 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0646',
      '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E'],
    ['\u0634\u0647\u0627\u062F\u0629 \u0627\u0646 \u0644\u0627 \u0627\u0644\u0647 \u0627\u0644\u0627 \u0627\u0644\u0644\u0647',
      '\u0634\u064E\u0647\u064E\u0627\u062F\u064E\u0629\u064F \u0623\u064E\u0646\u0651 \u0644\u0627\u064E \u0625\u0650\u0644\u064E\u0647\u064E \u0625\u0650\u0644\u0651\u0627 \u0627\u0644\u0644\u0651\u064E\u0647\u064F'],
    ['\u0648\u0627\u0646 \u0645\u062D\u0645\u062F\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647',
      '\u0648\u064E\u0623\u064E\u0646\u0651\u064E \u0645\u064F\u062D\u064E\u0645\u0651\u064E\u062F\u064B\u0627 \u0631\u064E\u0633\u0648\u0648\u0644\u064F \u0627\u0644\u0644\u0651\u064E\u0647\u0650'],
    ['\u0648\u0627\u0642\u0627\u0645 \u0627\u0644\u0635\u0644\u0627\u0629', '\u0648\u064E\u0625\u0650\u0642\u064E\u0627\u0645\u064F \u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u0650'],
    ['\u0648\u0627\u064A\u062A\u0627\u0621 \u0627\u0644\u0632\u0643\u0627\u0629', '\u0648\u064E\u0625\u0650\u064A\u062A\u064E\u0627\u0621\u064F \u0627\u0644\u0632\u0651\u064E\u0643\u064E\u0627\u0629\u0650'],
    ['\u0648\u0635\u0648\u0645 \u0631\u0645\u0636\u0627\u0646', '\u0648\u064E\u0635\u064E\u0648\u0652\u0645\u064F \u0631\u064E\u0645\u064E\u0636\u064E\u0627\u0646\u064E'],
    ['\u0648\u062D\u062C \u0627\u0644\u0628\u064A\u062A', '\u0648\u064E\u062D\u064E\u062C\u0651\u064F \u0627\u0644\u0628\u064E\u064A\u0652\u062A\u0650'],
    ['\u0643\u062A\u0627\u0628 \u0627\u062D\u0643\u0627\u0645 \u0627\u0644\u0637\u0647\u0627\u0631\u0629',
      '\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0623\u064E\u062D\u0652\u0643\u064E\u0627\u0645\u0650 \u0627\u0644\u0652\u0637\u064E\u0647\u064E\u0627\u0631\u064E\u0629\u0650']
  ];

  var HARAKAT_WORDS = {};
  (function () {
    var pairs = [
      // frasa pengujian bawaan
      ['\u0627\u062A\u0641\u0642\u062A', '\u0627\u0650\u062A\u0651\u064E\u0641\u064E\u0642\u064E\u062A\u0652'],
      ['\u0643\u0644\u0645\u0629', '\u0643\u064E\u0644\u0650\u0645\u064E\u0629\u064F'],
      ['\u0627\u0644\u0633\u0645\u0627\u0621', '\u0627\u0644\u0633\u0651\u064E\u0645\u064E\u0627\u0621\u0650'],
      ['\u0648\u0631\u0633\u0627\u0644\u0627\u062A\u0647\u0627', '\u0648\u064E\u0631\u0650\u0633\u064E\u0627\u0644\u064E\u0627\u062A\u064F\u0647\u064E\u0627'],
      ['\u0627\u0644\u0627\u0644\u0647\u064A\u0629', '\u0627\u0644\u0652\u0625\u0650\u0644\u064E\u0647\u0650\u064A\u0651\u064E\u0629\u064F'],
      ['\u0627\u0644\u0625\u0644\u0647\u064A\u0629', '\u0627\u0644\u0652\u0625\u0650\u0644\u064E\u0647\u0650\u064A\u0651\u064E\u0629\u064F'],
      ['\u0623\u0646', '\u0623\u064E\u0646\u0651\u064E'],
      ['\u0627\u0646', '\u0623\u064E\u0646\u0651\u064E'],
      ['\u0645\u0635\u062F\u0631', '\u0645\u064E\u0635\u0652\u062F\u064E\u0631\u064E'],
      ['\u0633\u0639\u0627\u062F\u0629', '\u0633\u064E\u0639\u064E\u0627\u062F\u064E\u0629\u0650'],
      ['\u0627\u0644\u0625\u0646\u0633\u0627\u0646', '\u0627\u0644\u0652\u0625\u0650\u0646\u0652\u0633\u064E\u0627\u0646\u0650'],
      ['\u0627\u0644\u0627\u0646\u0633\u0627\u0646', '\u0627\u0644\u0652\u0625\u0650\u0646\u0652\u0633\u064E\u0627\u0646\u0650'],
      ['\u0648\u0631\u0642\u064A\u0647', '\u0648\u064E\u0631\u064E\u0642\u0650\u064A\u0651\u0650\u0647\u0650'],
      ['\u0641\u064A', '\u0641\u0650\u064A'],
      ['\u0646\u0634\u0623\u0629', '\u0646\u064E\u0634\u0652\u0623\u064E\u0629\u0650'],
      ['\u0639\u0627\u0644\u0645', '\u0639\u064E\u0627\u0644\u064E\u0645\u0650'],
      ['\u0627\u0644\u062F\u0646\u064A\u0627', '\u0627\u0644\u062F\u0651\u064F\u0646\u0652\u064A\u064E\u0627'],
      // kosakata kitab kuning umum
      ['\u0641\u0635\u0644', '\u0641\u064E\u0635\u0652\u0644\u064C'],
      ['\u0627\u0631\u0643\u0627\u0646', '\u0623\u064E\u0631\u0652\u0643\u064E\u0627\u0646\u064F'],
      ['\u0627\u0644\u0627\u0633\u0644\u0627\u0645', '\u0627\u0644\u0652\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645\u0650'],
      ['\u062E\u0645\u0633\u0629', '\u062E\u064E\u0645\u0652\u0633\u064E\u0629\u064C'],
      ['\u0627\u0644\u0644\u0647', '\u0627\u0644\u0644\u0651\u064E\u0647\u0650'],
      ['\u0627\u0644\u0631\u062D\u0645\u0646', '\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650'],
      ['\u0627\u0644\u0631\u062D\u064A\u0645', '\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'],
      ['\u0627\u0644\u0628\u064A\u062A', '\u0627\u0644\u0628\u064E\u064A\u0652\u062A\u0650'],
      ['\u0627\u0644\u0635\u0644\u0627\u0629', '\u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u0650'],
      ['\u0627\u0644\u0632\u0643\u0627\u0629', '\u0627\u0644\u0632\u0651\u064E\u0643\u064E\u0627\u0629\u0650'],
      ['\u0627\u0644\u0645\u064A\u0627\u0647', '\u0627\u0644\u0652\u0645\u0650\u064A\u064E\u0627\u0647\u064F'],
      ['\u0627\u0644\u062A\u0637\u0647\u064A\u0631', '\u0627\u0644\u062A\u0651\u064E\u0637\u0652\u0647\u0650\u064A\u0631\u0650'],
      ['\u0645\u062D\u0645\u062F', '\u0645\u064F\u062D\u064E\u0645\u0651\u064E\u062F\u064C'],
      ['\u0631\u0633\u0648\u0644', '\u0631\u064E\u0633\u0648\u0648\u0644\u064F'],
      ['\u0628\u0631\u0647\u062A\u064A\u0629', '\u0628\u064E\u0631\u0652\u0647\u064E\u062A\u0650\u064A\u064E\u0629\u064D'],
      ['\u0643\u0631\u064A\u0631', '\u0643\u064E\u0631\u0650\u064A\u0652\u0631\u064D'],
      ['\u062A\u062A\u0644\u064A\u0629', '\u062A\u064E\u062A\u0652\u0644\u0650\u064A\u064E\u0629\u064D'],
      ['\u0637\u0648\u0631\u0627\u0646', '\u0637\u064E\u0648\u0652\u0631\u064E\u0627\u0646\u064D']
    ];
    pairs.forEach(function (p) { HARAKAT_WORDS[p[0]] = p[1]; });
  })();

  var EDGE_PUNCT = /^[\s\u060C\u061B\u061F.,:;!?()\[\]\u00AB\u00BB"'_=\-+*]+|[\s\u060C\u061B\u061F.,:;!?()\[\]\u00AB\u00BB"'_=\-+*]+$/g;

  // ---------- partikel & kata baku (harokat tetap) ----------
  (function () {
    var particles = [
      ['\u0648', '\u0648\u064E'], ['\u0641', '\u0641\u064E'], ['\u0628', '\u0628\u0650'],
      ['\u0644', '\u0644\u0650'], ['\u0643', '\u0643\u064E'],
      ['\u0645\u0646', '\u0645\u0650\u0646\u0652'], ['\u0639\u0646', '\u0639\u064E\u0646\u0652'],
      ['\u0639\u0644\u0649', '\u0639\u064E\u0644\u064E\u0649'], ['\u0627\u0644\u0649', '\u0625\u0650\u0644\u064E\u0649'],
      ['\u062D\u062A\u0649', '\u062D\u064E\u062A\u0651\u064E\u0649'], ['\u062B\u0645', '\u062B\u064F\u0645\u0651\u064E'],
      ['\u0628\u0644', '\u0628\u064E\u0644\u0652'], ['\u0644\u0627', '\u0644\u064E\u0627'],
      ['\u0644\u0643\u0646', '\u0644\u064E\u0643\u0650\u0646\u0651\u064E'], ['\u0643\u064A', '\u0643\u064E\u064A\u0652'],
      ['\u0644\u0648', '\u0644\u064E\u0648'], ['\u0644\u0645', '\u0644\u064E\u0645\u0652'],
      ['\u0644\u0645\u0627', '\u0644\u064E\u0645\u0651\u064E\u0627'], ['\u0645\u0627', '\u0645\u064E\u0627'],
      ['\u0647\u0630\u0627', '\u0647\u064E\u0630\u064E\u0627'], ['\u0647\u0630\u0647', '\u0647\u064E\u0630\u0650\u0647\u0650'],
      ['\u0630\u0644\u0643', '\u0630\u064E\u0644\u0650\u0643\u064E'], ['\u062A\u0644\u0643', '\u062A\u0650\u0644\u0652\u0643\u064E'],
      ['\u0627\u0644\u0630\u064A', '\u0627\u0644\u0651\u064E\u062F\u0650\u064A'], ['\u0627\u0644\u062A\u064A', '\u0627\u0644\u0651\u064E\u062A\u0650\u064A'],
      ['\u0627\u0644\u0630\u064A\u0646', '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E'], ['\u0643\u0644', '\u0643\u064F\u0644\u0651\u064E'],
      ['\u0628\u0639\u0636', '\u0628\u064E\u0639\u0652\u0636\u064E'], ['\u063A\u064A\u0631', '\u063A\u064E\u064A\u0652\u0631\u064E'],
      ['\u0639\u0646\u062F', '\u0639\u0650\u0646\u0652\u062F\u064E'], ['\u0628\u0639\u062F', '\u0628\u064E\u0639\u0652\u062F\u064E'],
      ['\u0642\u0628\u0644', '\u0642\u064E\u0628\u0652\u0644\u064E'], ['\u0641\u0648\u0642', '\u0641\u064E\u0648\u0642\u064E'],
      ['\u062A\u062D\u062A', '\u062A\u064E\u062D\u0652\u062A\u064E'], ['\u0647\u0644', '\u0647\u064E\u0644\u0652'],
      ['\u0642\u062F', '\u0642\u064E\u062F\u0652'], ['\u0644\u0642\u062F', '\u0644\u064E\u0642\u064E\u062F\u0652'],
      ['\u0643\u0645\u0627', '\u0643\u064E\u0645\u064E\u0627'], ['\u0627\u0630\u0627', '\u0625\u0650\u0630\u064E\u0627'],
      ['\u0627\u0630', '\u0625\u0650\u0630\u0652'], ['\u062D\u064A\u0646', '\u062D\u0650\u064A\u0646\u064E'],
      ['\u064A\u0648\u0645', '\u064A\u064E\u0648\u0652\u0645\u064E'], ['\u0643\u0627\u0646', '\u0643\u064E\u0627\u0646\u064E'],
      ['\u0642\u0627\u0644', '\u0642\u064E\u0627\u0644\u064E'], ['\u0644\u064A\u0633', '\u0644\u064E\u064A\u0652\u0633\u064E'],
      ['\u062C\u0639\u0644', '\u062C\u064E\u0639\u064E\u0644\u064E'], ['\u0635\u0627\u0631', '\u0635\u064E\u0627\u0631\u064E'],
      ['\u064A\u0643\u0648\u0646', '\u064A\u064E\u0643\u064F\u0648\u0646\u064F'], ['\u064A\u0642\u0648\u0644', '\u064A\u064E\u0642\u064F\u0648\u0644\u064F'],
      ['\u0625\u0646', '\u0625\u0650\u0646\u0651\u064E'], ['\u0623\u0646', '\u0623\u064E\u0646\u0651\u064E'],
      ['\u0648\u0644\u0627', '\u0648\u064E\u0644\u064E\u0627'], ['\u0641\u0644\u0627', '\u0641\u064E\u0644\u064E\u0627'],
      ['\u0623\u064A\u0636\u0627', '\u0623\u064E\u064A\u0652\u0636\u064B\u0627'], ['\u0641\u0642\u0637', '\u0641\u064E\u0642\u064E\u0637\u0652'],
      ['\u0644\u0648\u0644\u0627', '\u0644\u064E\u0648\u0652\u0644\u064E\u0627'], ['\u0623\u0644\u0627', '\u0623\u064E\u0644\u064E\u0627'],
    ];
    particles.forEach(function (p) {
      if (!HARAKAT_WORDS[p[0]]) HARAKAT_WORDS[p[0]] = p[1];
    });
  })();

  /**
   * Penebak vokal untuk kata yang tidak ada di kamus — agar hasil tidak pernah
   * menjadi tumpukan konsonan ("al-mqdmt"). Kualitas "dikira", bukan pasti benar.
   */
  function guessHarokat(core) {
    var letters = stripDiacritics(core).split('');
    if (!letters.length) return null;
    var out = [];
    var i = 0;
    // proklitik + artikel: وَالْ... / فَالْ... / بِالْ... / لِالْ...
    if (letters.length > 4 && '\u0648\u0641\u0628\u0644\u0643\u0633'.indexOf(letters[0]) >= 0 &&
        letters[1] === ALEF && letters[2] === LAM) {
      var PROCL = { '\u0648': '\u0648\u064E', '\u0641': '\u0641\u064E', '\u0628': '\u0628\u0650', '\u0644': '\u0644\u0650', '\u0643': '\u0643\u064E', '\u0633': '\u0633\u064E' };
      return PROCL[letters[0]] + guessHarokat(letters.slice(1).join(''));
    }
    // artikel الْ — idgham syamsiyah: sun letter diberi syaddah
    var sunFirst = false;
    if (letters.length > 2 && letters[0] === ALEF && letters[1] === LAM) {
      out.push('\u0627\u0644\u0652');
      i = 2;
      if (SUN[letters[2]]) sunFirst = true;
    } else if ((letters[0] === ALEF || letters[0] === A_WASLA) && letters[1] !== LAM && letters.length > 1) {
      out.push('\u0627\u0650'); // اِ hamzatul washl non-artikel
      i = 1;
    }
    for (; i < letters.length; i++) {
      var ch = letters[i];
      if (ch === TA_MARB) { out.push('\u0629\u064F'); continue; } // ةُ (dikira marfu')
      out.push(ch);
      if (sunFirst && i === 2) out.push(SHADDA);                 // idgham syamsiyah
      var next = letters[i + 1];
      if (next === ALEF) { out.push('\u064E'); continue; }          // ...a + ا = aa
      if (next === WAW) { out.push('\u064F'); continue; }           // ...u + و = uu
      if (next === YA || next === YA_MAQ) { out.push('\u0650'); continue; } // ...i + ي = ii
      if (i === letters.length - 1) out.push('\u064F');             // akhir: dammah (dikira marfu')
      else out.push('\u064E');                                      // sela: fathah
    }
    return out.join('');
  }

  /**
   * Cari padanan harokat untuk inti kata. Strategi:
   *  1) padanan persis (gundul);
   *  2) padanan skeleton (tahan beda hamzah/ta marbuthah) bila TIDAK ambigu;
   *  3) lepas awalan yang tergabung (و ف ب ل ك س) lalu ulangi (mis. والانسان → وَ + الانسان).
   */
  function lookupWord(core) {
    if (!core) return null;
    if (HARAKAT_WORDS[core]) return HARAKAT_WORDS[core];
    var sk = skeleton(core);
    var found = null, count = 0;
    for (var k in HARAKAT_WORDS) {
      if (skeleton(k) === sk) { found = HARAKAT_WORDS[k]; count++; }
    }
    if (count === 1) return found;
    var m = core.match(/^([\u0648\u0641\u0628\u0644\u0643\u0633])(.+)$/);
    if (m && m[2] !== core) {
      var pre = { '\u0648': '\u0648\u064E', '\u0641': '\u0641\u064E', '\u0628': '\u0628\u0650',
                  '\u0644': '\u0644\u0650', '\u0643': '\u0643\u064E', '\u0633': '\u0633\u064E' }[m[1]];
      var rest = lookupWord(m[2]);
      if (pre && rest) return pre + rest;
    }
    return null;
  }

  /**
   * Harokat offline berbasis kata (bukan regex \b yang buta huruf Arab).
   * Mengembalikan { text, coverage } — coverage = frasa/kata yang berhasil
   * diberi harokat (0..1), dilaporkan apa adanya kepada pengguna.
   */
  function localHarokat(text) {
    if (!text) return { text: '', coverage: 0, guessed: 0 };
    var arabicWords = 0, hitWords = 0, guessedWords = 0;

    var phrases = HARAKAT_PHRASES.slice().sort(function (a, b) {
      return b[0].split(/\s+/).length - a[0].split(/\s+/).length;
    });

    var result = String(text).split('\n').map(function (line) {
      if (!/[\u0600-\u06FF]/.test(line)) return line;
      var words = line.split(/\s+/).filter(Boolean);
      var used = new Array(words.length);

      // Frasa multi-kata dulu (toleran skeleton), tanda terpakai per posisi.
      phrases.forEach(function (p) {
        var keys = p[0].split(/\s+/).filter(Boolean);
        var vals = p[1].split(/\s+/).filter(Boolean);
        var n = keys.length;
        for (var i = 0; i + n <= words.length; i++) {
          var free = true;
          for (var j = 0; j < n; j++) if (used[i + j]) { free = false; break; }
          if (!free) continue;
          var match = true;
          for (var j = 0; j < n; j++) {
            var core = words[i + j].replace(EDGE_PUNCT, '');
            if (skeleton(core) !== skeleton(keys[j])) { match = false; break; }
          }
          if (match) for (var j = 0; j < n; j++) used[i + j] = vals[j] || words[i + j];
        }
      });

      return words.map(function (w, i) {
        if (used[i]) { arabicWords++; hitWords++; return used[i]; }
        var core = w.replace(EDGE_PUNCT, '');
        if (!core || !isArabicChar(core[0])) return w;
        arabicWords++;
        var res = lookupWord(core);
        if (res) { hitWords++; return w.split(core).join(res); }
        var g = guessHarokat(core); // vokal dikira — jangan biarkan jadi tumpukan konsonan
        if (g) { guessedWords++; return w.split(core).join(g); }
        return w;
      }).join(' ');
    }).join('\n');

    var coverage = arabicWords > 0 ? hitWords / arabicWords : 0;
    var guessed = arabicWords > 0 ? guessedWords / arabicWords : 0;
    return { text: result, coverage: coverage, guessed: guessed };
  }

  /**
   * Terjemahan offline yang JUJUR: hanya untuk teks pengujian bawaan yang maknanya
   * benar-benar diketahui; selain itu TIDAK mengarang terjemahan.
   */
  var TEST_SAMPLE = '\u0627\u062A\u0641\u0642\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0645\u0627\u0621 \u0648\u0631\u0633\u0627\u0644\u0627\u062A\u0647\u0627 \u0627\u0644\u0625\u0644\u0647\u064A\u0629 \u0623\u0646 \u0645\u0635\u062F\u0631 \u0633\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0646\u0633\u0627\u0646 \u0648\u0631\u0642\u064A\u0647 \u0641\u064A \u0646\u0634\u0623\u0629 \u0639\u0627\u0644\u0645 \u0627\u0644\u062F\u0646\u064A\u0627';

  function normalizeWords(t) {
    return stripDiacritics(t || '').replace(/[\s\u060C\u061B\u061F.,:;!?]+/g, ' ').trim();
  }

  function localTranslation(text) {
    if (skeleton(normalizeWords(text)) === skeleton(normalizeWords(TEST_SAMPLE))) {
      return 'Telah sepakat firman langit dan risalah-risalah ketuhanan bahwa sumber kebahagiaan manusia serta kemajuannya berada dalam kehidupan alam dunia.';
    }
    return '';
  }

  /** Membersihkan hasil ekstraksi gambar: pastikan gundul tanpa komentar pengantar. */
  function cleanExtractedArabic(raw) {
    if (!raw) return '';
    var text = raw
      .replace(/```[a-zA-Z]*/g, '')
      .replace(/\u201C|\u201D|"|'/g, '')
      .trim();
    var lines = text.split(/\r?\n/);
    var kept = [];
    var preamble = /^(berikut|ini|teks|hasil|here|below|note|catatan|the text|arabic)\b/i;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var hasArabic = /[\u0600-\u06FF]/.test(line);
      if (!hasArabic && preamble.test(line)) continue;
      kept.push(line);
    }
    // buang tasykil agar benar-benar "gundul"
    return stripDiacritics(kept.join(' ')).replace(/\s+/g, ' ').trim();
  }

  // ---------- mufradat kitab & syarah offline ----------

  /** Pemecah kalimat (berbasis tanda baca Arab & Latin, tanpa lookbehind). */
  function splitSentences(text) {
    var m = String(text || '').match(/[^.؟!\u06D4\n]+[.؟!\u06D4]*|\n/g);
    return (m || [])
      .map(function (s) { return s.replace(/\n/g, ' ').trim(); })
      .filter(function (s) { return s && /[\u0600-\u06FF]/.test(s); });
  }

  /** Kamus mufradat: kunci gundul -> arti Indonesia (kosakata kitab kuning umum). */
  var MUFRADAT = {};
  (function () {
    var pairs = [
      ['\u0643\u062A\u0627\u0628', 'kitab'], ['\u0623\u062D\u0643\u0627\u0645', 'hukum-hukum'],
      ['\u0627\u0644\u0637\u0647\u0627\u0631\u0629', 'bersuci'], ['\u0627\u0644\u0635\u0651\u0644\u0627\u0629', 'salat'],
      ['\u0627\u0644\u0632\u0651\u0643\u0627\u0629', 'zakat'], ['\u0627\u0644\u0635\u0651\u0648\u0645', 'puasa'],
      ['\u0627\u0644\u062D\u0651\u062C\u0651', 'haji'], ['\u0627\u0644\u0646\u0651\u0643\u0627\u062D', 'nikah/perkawinan'],
      ['\u0627\u0644\u0637\u0651\u0644\u0627\u0642', 'talak'], ['\u0627\u0644\u0645\u0650\u064A\u0631\u0627\u062B', 'waris'],
      ['\u0641\u064E\u0642\u0652\u0647', 'fiqih'], ['\u0646\u0652\u0635\u0652\u0651', 'nash/dalil'],
      ['\u0639\u0650\u0644\u0652\u0645', 'ilmu'], ['\u0641\u064E\u0631\u0652\u0636', 'fardu'],
      ['\u0648\u0627\u062C\u0650\u0628', 'wajib'], ['\u0645\u064F\u0628\u0627\u062D', 'mubah'],
      ['\u062D\u064E\u0631\u0627\u0645', 'haram'], ['\u0645\u064E\u0643\u0652\u0631\u0648\u0647', 'makruh'],
      ['\u0645\u064F\u0633\u0652\u062A\u064E\u062D\u064E\u0628\u0651\u0628', 'sunnah/disukai'],
      ['\u0645\u064F\u0642\u064E\u062F\u0651\u0645\u0629', 'muqaddimah'], ['\u0628\u0627\u0628', 'bab'],
      ['\u0641\u064E\u0635\u0652\u0644', 'fasal'], ['\u0645\u0633\u0627\u0626\u0644', 'masalah-masalah'],
      ['\u0645\u0633\u0626\u0644\u0629', 'masalah'], ['\u0641\u064E\u0631\u0652\u0639', 'furuk/cabang'],
      ['\u062F\u064E\u0644\u0650\u064A\u0644', 'dalil'], ['\u0642\u0650\u064A\u0627\u0633', 'qiyas'],
      ['\u0625\u0650\u062C\u0652\u0645\u0627\u0639', 'ijmak'], ['\u062E\u064E\u0644\u0627\u0641', 'khilaf/perbedaan'],
      ['\u0642\u064E\u0648\u0644', 'ucapan/pendapat'], ['\u0631\u064F\u0648\u0627\u064A\u0629', 'riwayat'],
      ['\u0635\u064E\u062D\u0650\u064A\u062D', 'shahih'], ['\u0636\u064E\u0639\u0650\u064A\u0641', 'lemah'],
      ['\u0627\u0644\u0641\u0627\u062A\u062D\u0629', 'Al-Fatihah'], ['\u0645\u064F\u062D\u064E\u0645\u0651\u062F', 'Muhammad'],
      ['\u0631\u064E\u0633\u0648\u0648\u0644', 'utusan/rasul'], ['\u0627\u0644\u0644\u0651\u0647', 'Allah'],
      ['\u0631\u064E\u0628\u0651', 'Tuhan'], ['\u0627\u0644\u0639\u0651\u0627\u0644\u0645\u0650\u064A\u0646', 'seluruh alam'],
      ['\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646', 'Maha Pengasih'],
      ['\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645', 'Maha Penyayang'],
      ['\u0627\u0644\u062F\u0651\u0650\u064A\u0646', 'agama/pembalasan'], ['\u0627\u0644\u0646\u0651\u0627\u0633', 'manusia'],
      ['\u064A\u064E\u0648\u0645', 'hari'], ['\u062D\u064E\u0633\u0627\u0628', 'hisab/perhitungan'],
      ['\u0639\u064E\u0645\u064E\u0644', 'amal'], ['\u062E\u064E\u064A\u0652\u0631', 'kebaikan'],
      ['\u0634\u064E\u0631\u0651', 'keburukan'], ['\u062A\u064E\u0642\u0652\u0648\u0649', 'takwa'],
      ['\u0625\u0650\u064A\u0645\u0627\u0646', 'iman'], ['\u0643\u064F\u0641\u0652\u0631', 'kekufuran'],
      ['\u0635\u0651\u0644\u0627\u0629', 'salat'], ['\u0635\u0650\u064A\u0627\u0645', 'puasa'],
      ['\u062D\u064E\u062C\u0651\u0629', 'haji'], ['\u0639\u064F\u0645\u0652\u0631\u0629', 'umrah'],
      ['\u0634\u064E\u0647\u064E\u0627\u062F\u064E\u0629', 'syahadah/kesaksian'],
      ['\u0631\u064F\u0643\u064F\u0648\u0639', 'ruku'], ['\u0633\u064F\u062C\u064F\u0648\u062F', 'sujud'],
      ['\u0648\u064F\u0636\u064F\u0648\u0621', 'wudu'], ['\u063A\u064F\u0633\u0652\u0644', 'mandi'],
      ['\u062A\u064E\u064A\u0651\u0645\u064F\u0645', 'tayamum'], ['\u062D\u064E\u064A\u0636', 'haid'],
      ['\u0625\u0650\u062D\u0652\u0631\u0627\u0645', 'ihram'], ['\u0631\u0650\u0628\u0627\u0648', 'riba'],
      ['\u0628\u064E\u064A\u0652\u0639', 'jual beli'], ['\u0625\u0650\u062C\u064E\u0627\u0631\u0629', 'sewa'],
      ['\u0642\u064E\u0627\u0636\u0650\u064A', 'hakim/qadhi'], ['\u0634\u064E\u0627\u0647\u0650\u062F', 'saksi'],
      ['\u0628\u064E\u064A\u0651\u0650\u0646\u0629', 'bukti'], ['\u062D\u064F\u062F\u064F\u0648\u062F', 'had/hukuman'],
      ['\u0642\u064E\u0635\u064E\u0627\u0635', 'qisas'], ['\u062F\u0650\u064A\u064E\u0627\u062A', 'diyat/denda'],
      ['\u0639\u0650\u0628\u064E\u0627\u062F\u0627\u062A', 'ibadah'], ['\u0645\u064F\u0639\u0627\u0645\u064E\u0644\u0627\u062A', 'muamalah'],
      ['\u0627\u0631\u0652\u0643\u064E\u0627\u0646', 'rukn/syarat utama'], ['\u0627\u0644\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645', 'Islam'],
      ['\u0627\u0644\u0625\u0650\u064A\u0645\u0627\u0646', 'iman'], ['\u0627\u0644\u0625\u0650\u062D\u0652\u0633\u064E\u0627\u0646', 'ihsan'],
      ['\u0637\u064E\u0647\u064E\u0627\u0631\u0629', 'kesucian'], ['\u0646\u064E\u062C\u0627\u0633\u0629', 'najis'],
      ['\u0627\u0644\u0645\u0627\u0621', 'air'], ['\u062C\u064E\u0646\u064E\u0627\u0628\u0629', 'junub'],
      ['\u0633\u064E\u0641\u064E\u0631', 'perjalanan'], ['\u0636\u064E\u064A\u0652\u0641', 'tamu'],
      ['\u062C\u064E\u0627\u0621\u064E', 'datang'], ['\u0648\u0627\u062C\u064E\u0628\u064E', 'wajib'],
      ['\u0646\u064E\u0635\u0651\u064E', 'teks'], ['\u0627\u0644\u0644\u0651\u064E\u0647\u064F', 'Allah'],
      ['\u0627\u062A\u0651\u064E\u0641\u064E\u0642\u064E\u062A\u0652', 'telah sepakat'],
      ['\u0643\u064E\u0644\u0650\u0645\u064E\u0629\u064F', 'kata/firman'], ['\u0627\u0644\u0633\u0651\u064E\u0645\u0627\u0621', 'langit'],
      ['\u0627\u0644\u0625\u0650\u0646\u0652\u0633\u064E\u0627\u0646', 'manusia'],
      ['\u0633\u064E\u0639\u064E\u0627\u062F\u064E\u0629', 'kebahagiaan'], ['\u0639\u064E\u0627\u0644\u0645', 'alam'],
      ['\u0627\u0644\u062F\u0651\u064F\u0646\u0652\u064A\u064E\u0627', 'dunia'], ['\u062F\u064E\u0628\u064E\u0631\u0627\u062C', 'permulaan'],
      ['\u0648\u0627\u0644\u0634\u0651\u0647\u0627\u062F\u0629', 'dan kesaksian'],
      ['\u0627\u0644\u0623\u064E\u0648\u0651\u064E\u0629', 'yang pertama'], ['\u0627\u0644\u062B\u0651\u0627\u0646\u0650\u064A\u0629', 'yang kedua'],
      ['\u0627\u0644\u062B\u0651\u0627\u0644\u0650\u062B\u0629', 'yang ketiga'], ['\u0627\u0644\u0631\u064E\u0627\u0628\u0650\u0639\u0629', 'yang keempat'],
      ['\u0627\u0644\u062E\u064E\u0627\u0645\u0650\u0633\u0629', 'yang kelima'], ['\u0648\u062C\u064F\u0647\u0629', 'segi/tujuan'],
      ['\u0646\u064E\u0641\u064E\u0639', 'manfaat'], ['\u0636\u064E\u0631\u0631', 'bahaya'],
    ];
    pairs.forEach(function (p) {
      MUFRADAT[p[0]] = p[1];
      MUFRADAT[stripDiacritics(p[0])] = p[1]; // kunci gundul juga
    });
  })();

  function lookupMufradat(core) {
    if (!core) return null;
    if (MUFRADAT[core]) return MUFRADAT[core];
    var sk = skeleton(core);
    var found = null, ambiguous = false;
    for (var k in MUFRADAT) {
      if (skeleton(k) !== sk) continue;
      if (found === null) found = MUFRADAT[k];
      else if (found !== MUFRADAT[k]) { ambiguous = true; break; } // arti beda = bingung
    }
    if (!ambiguous && found) return found;
    // lepas artikel ال atau awalan tergabung
    var m = core.match(/^[\u0648\u0641\u0628\u0644\u0643\u0633\u0627\u0644](.+)$/);
    if (m && m[1].length > 1) {
      var rest = lookupMufradat(m[1]);
      if (rest) return rest;
    }
    return null;
  }

  /**
   * Syarah offline (jujur): arti per kata dari kamus mufradat + perkiraan urutan arti.
   * Penjelasan i'rab & kaidah nahwu-sharaf penuh hanya via AI (API key).
   */
  function localSyarah(text) {
    var sentences = splitSentences(text);
    var out = sentences.map(function (kal) {
      var words = kal.split(/\s+/).filter(Boolean);
      var kosakata = words.map(function (w) {
        var core = w.replace(EDGE_PUNCT, '');
        if (!core || !isArabicChar(core[0])) return { kata: w, arti: null, arab: false };
        return { kata: core, arti: lookupMufradat(core), arab: true };
      });
      var terkira = kosakata
        .filter(function (k) { return k.arab; })
        .map(function (k) { return k.arti || '[?]'; })
        .join(' + ');
      return { asli: kal, kosakata: kosakata, terkira: terkira };
    });
    return {
      mode: 'offline',
      catatan: "Syarah offline baru berupa arti per kata dari kamus mufradat; penjelasan i'rab, kaidah nahwu-sharaf, dan penyambungan makna memerlukan API key Gemini (tombol Syarah).",
      kalimat: out,
    };
  }

  // ---------- 3 Hukum Nahwu Sharaf & pemeriksa otomatis ----------

  /** Tiga hukum nahwu-sharaf untuk ketepatan harokat (versi final pengguna). */
  var NAWHU_RULES = [
    {
      no: 1,
      nama: "Fi'il & Isim ber-AL tidak bertanwin",
      penjelasan: "Kata kerja (fi'il) tidak pernah bertanwin. Isim yang ber-AL (ma'rifah) juga tidak bertanwin — harokatnya fathah/dammah/kasrah sesuai i'rab.",
      contohSalah: 'لَا تَنْحَصِرْ / الْهَمُّ الْأَكْبَرُ',
      contohBenar: 'لَا تَنْحَصِرُ (fi\'il mudhari\' marfu\' dammah) / الْهَمَّ الْأَكْبَرَ (maf\'ul mansub, tasydid)',
    },
    {
      no: 2,
      nama: 'Idhafah: mudhaf tanpa AL, tanpa tanwin',
      penjelasan: 'Kata pertama sambungan idhafah (mudhaf) ditulis TANPA AL dan TANPA tanwin; harokatnya mengikuti i\'rabnya (umumnya kasrah bila majrur).',
      contohSalah: 'الْكَلِمَةُ السَّمَاءِ / لِسَان النُّور',
      contohBenar: 'كَلِمَةُ السَّمَاءِ / لِسَانِ النُّورِ الْمُحَمَّدِيِّ / رَسُولِ اللهِ',
    },
    {
      no: 3,
      nama: 'Anna = أَنَّ (tasydid) + mansub',
      penjelasan: 'Anna ditulis أَنَّ dengan tasydid pada nun-nya; kata sesudahnya wajib mansub (berfathah).',
      contohSalah: 'أَنَّ مَصْدِرِ',
      contohBenar: 'أَنَّ مَصْدَرَ',
    },
  ];

  // Contoh muqaddimah (versi final yang sudah dikoreksi 100% sesuai 3 hukum).
  var MUQADDIMAH_HAROKAT = 'الْمُقَدِّمَةُ\nاِتَّفَقَتْ كَلِمَةُ السَّمَاءِ وَرِسَالَاتُهَا الْإِلَهِيَّةُ أَنَّ مَصْدَرَ سَعَادَةِ الْإِنْسَانِ وَرُقِيِّهِ فِي نَشْأَةِ عَالَمِ الدُّنْيَا لَا تَنْحَصِرُ فِي خُصُوصِ إِشْبَاعِ غَرَائِزِهِ الْحَيَوَانِيَّةِ وَتَلْبِيَةِ طَلَبَاتِهِ وَرَغَبَاتِهِ الْمَادِّيَّةِ الْبَحْتَةِ الَّتِي أَضْحَتِ الْهَمَّ الْأَكْبَرَ فِي مُجْتَمَعِنَا الشَّرْقِيِّ وَالْإِسْلَامِيِّ وَالَّتِي تَرَكَتِ الْآثَارَ الْوَخِيمَةَ عَلَى حَرَكَةِ الْفِكْرِ وَالسُّلُوكِ الْأَخْلَاقِيِّ مِمَّا جَعَلَ الْأُمَّةَ الْإِسْلَامِيَّةَ تَعِيشُ حَالَةَ الْجَفَافِ الرُّوحِيِّ وَالضَّيَاعِ الْفِكْرِيِّ وَالْخُلُقِيِّ، مَعَ الْعِلْمِ بِأَنَّ السَّعَادَةَ كُلَّ السَّعَادَةِ هُوَ أَنْ يَمْتَلِكَ الْفَرْدُ الْمُسْلِمُ الْقُوَّةَ الرُّوحِيَّةَ الَّتِي تَعْتَمِدُ عَلَى مُقَوِّمَاتِ تَعَالِيمِ الْقُرْآنِ وَالسُّنَّةِ النَّبَوِيَّةِ الْكَامِلَةِ الَّتِي أَضَاءَتْ طَرِيقَ الرَّاغِبِينَ فِي الْحُصُولِ عَلَى التَّعَالِيمِ السَّامِيَةِ الَّتِي تُعَالِجُ مَشَاكِلَ وَحَوَادِثَ الْجَانِبِ الرُّوحِيِّ فِي حَيَاةِ الْإِنْسَانِ فِي أَكْثَرَ مِنْ جَانِبٍ عَمَلِيٍّ.\nكَمَا أَنَّنَا نَلْفِتُ أَنْظَارَ الْقُرَّاءِ إِلَى أَنَّ هَذَا الْكِتَابَ الَّذِي بَيْنَ يَدَيْكَ إِنْ هُوَ إِلَّا مَجْمُوعَةٌ قَيِّمَةٌ خَرَجَتْ مِنْ لِسَانِ النُّورِ الْمُحَمَّدِيِّ الشَّرِيفِ الَّذِي أَضَاءَ الْكَوْنَ بِتَعَالِيمِهِ الْقَيِّمَةِ السَّامِيَةِ الَّتِي هِيَ تَرْجُمَانٌ كَامِلٌ لِمَنْطِقِ الْوَحْيِ الْإِلَهِيِّ...\nفَقَدْ تَضَمَّنَ جُمْلَةً وَافِرَةً مُتَنَوِّعَةً لِمُعَالَجَةِ الْأَمْرَاضِ الرُّوحِيَّةِ بِمُخْتَلِفِ أَنْوَاعِهَا وَتَفَرُّعَاتِهَا وَقَدَّمَ لِكُلِّ مَرَضٍ يُبْتَلَى بِهِ الْفَرْدُ الْمُسْلِمُ عِلَاجَهُ الْمُنَاسِبَ بِالطَّرِيقَةِ الْمُقَرَّرَةِ الَّتِي تَضَمَّنَهَا كَلَامُ رَسُولِ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ فِي خِطَابَاتِهِ الْإِلَهِيَّةِ لِمُعَالَجَةِ الْمَشَاكِلِ وَالْحَوَادِثِ الرُّوحِيَّةِ الَّتِي لَهَا الصَّدَى الْعَمِيقُ فِي مُجْتَمَعِنَا الشَّرْقِيِّ الْإِسْلَامِيِّ.\nكَمَا نَوَدُّ أَنْ نَلْفِتَ أَنْظَارَ الْقُرَّاءِ الْكِرَامِ إِلَى أَنَّ هَذَا الْكِتَابَ مُخْتَصٌّ لِبَيَانِ...';

  // Kamus otomatis: seluruh kata dari muqaddimah ground truth + partikel umum.
  (function () {
    var parts = String(MUQADDIMAH_HAROKAT || '').split(/[\s\u060C\u061B\u061F\u0640\n]+/);
    for (var i = 0; i < parts.length; i++) {
      // buang tanda baca di tepi SAJA — tanda vokal wajib ikut tersimpan
      var word = parts[i].replace(/^[^\u0621-\u064A\u064B-\u0652\u0670]+|[^\u0621-\u064A\u064B-\u0652\u0670]+$/g, '');
      if (!word) continue;
      var w = stripDiacritics(word);
      if (w && HARAKAT_WORDS[w] === undefined) HARAKAT_WORDS[w] = word;
    }
  })();

  /** Pemeriksa 3 hukum nahwu-sharaf (otomatis, deterministik). */
  function checkNahwu(text) {
    var temuan = [];
    var raw = String(text || '').split(/\s+/).filter(Boolean);
    function coreOf(w) { return stripDiacritics(w).replace(EDGE_PUNCT, ''); }
    function hasTanwin(w) { return w.indexOf(FATHATAN) >= 0 || w.indexOf(KASRATAN) >= 0 || w.indexOf(DHAMMATAN) >= 0; }
    function hasAL(core) {
      return core.indexOf('\u0627\u0644') === 0 ||
        /^[\u0648\u0641\u0628\u0644\u0643\u0633]\u0627\u0644/.test(core);
    }
    function isMuthanna(w) { return /\u064E?\u0627\u0646\u0650?$/.test(w) && /\u0627\u0646\u0650?$/.test(coreOf(w)); } // ...ani/ayni
    function hasMark(w, mark) { return w.indexOf(mark) >= 0; }
    function endsMansub(w) {
      // fathah, fathatan, alif panjang/khanjariyah di akhir = tanda mansub
      var chars = w.split('');
      for (var k = chars.length - 1; k >= 0; k--) {
        var c = chars[k];
        if (IGNORED[c] || c === SHADDA) continue;
        if (VOW[c]) {
          var v = VOW[c];
          return v === 'a' || v === 'an' || v === 'aa';
        }
        if (c === SUKUN) return false;
        return c === ALEF; // manqus/mamdud: "...a" panjang
      }
      return false;
    }

    for (var i = 0; i < raw.length; i++) {
      var w = raw[i], core = coreOf(w);
      if (!core || !isArabicChar(core[0])) continue;

      // --- Hukum 1: isim ber-AL tidak bertanwin ---
      if (hasAL(core) && hasTanwin(w) && !isMuthanna(w)) {
        temuan.push({
          hukum: 1, jenis: 'pasti', kata: core,
          alasan: "Isim ber-AL tidak bertanwin.",
          saran: 'Ganti tanwin dengan harokat i\u2019rab (fathah/dammah/kasrah) sesuai kedudukan kata.',
        });
      }

      // --- Hukum 2: dicurigai idhafah — kata bertanwin diikuti kata ber-AL ---
      if (hasTanwin(w) && i + 1 < raw.length) {
        var next = coreOf(raw[i + 1]);
        if (next && isArabicChar(next[0]) && hasAL(next) && !/^[.,،؛:!?؟]/.test(raw[i + 1])) {
          temuan.push({
            hukum: 2, jenis: 'dicurigai', kata: core,
            alasan: 'Kata bertanwin diikuti kata ber-AL — kemungkinan idhafah; mudhaf tidak bertanwin.',
            saran: 'Periksa: bila ini idhafah, gugurkan tanwin (mis. كَلِمَةُ السَّمَاءِ, لِسَانِ النُّورِ).',
          });
        }
      }

      // --- Hukum 3: kata setelah أَنَّ wajib mansub ---
      var isAnna = (core === '\u0623\u0646' || core === '\u0627\u0646' ||
        /^[\u0648\u0641\u0628\u0644\u0643]\u0623?\u0646$/.test(core)) && hasMark(w, SHADDA);
      if (isAnna && i + 1 < raw.length) {
        var w2 = raw[i + 1], c2 = coreOf(w2);
        if (c2 && isArabicChar(c2[0]) && !endsMansub(w2)) {
          temuan.push({
            hukum: 3, jenis: 'pasti', kata: c2,
            alasan: 'Kata setelah أَنَّ harusnya mansub (berfathah).',
            saran: 'Ubah akhiran menjadi fathah (mis. أَنَّ مَصْدَرَ, bukan مَصْدِرِ).',
          });
        }
      }
    }
    return { ok: temuan.length === 0, temuan: temuan };
  }

  return {
    isHarakat: isHarakat,
    isArabicChar: isArabicChar,
    stripDiacritics: stripDiacritics,
    skeleton: skeleton,
    canonMarks: canonMarks,
    levenshtein: levenshtein,
    similarity: similarity,
    isFaithful: isFaithful,
    transliterate: transliterate,
    WASHAL_RULES: WASHAL_RULES,
    NAWHU_RULES: NAWHU_RULES,
    checkNahwu: checkNahwu,
    MUQADDIMAH_HAROKAT: MUQADDIMAH_HAROKAT,
    localHarokat: localHarokat,
    guessHarokat: guessHarokat,
    localTranslation: localTranslation,
    MUFRADAT: MUFRADAT,
    splitSentences: splitSentences,
    localSyarah: localSyarah,
    cleanExtractedArabic: cleanExtractedArabic,
    TEST_SAMPLE: TEST_SAMPLE
  };
});
