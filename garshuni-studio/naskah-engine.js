/**
 * NaskahEngine - mesin teks Arab untuk Garshuni Studio (murni JS, tanpa dependensi).
 *
 * Berisi:
 *  1. stripDiacritics / skeleton / levenshtein / similarity  -> penjaga mutu hasil AI
 *  2. transliterate()  -> "Latin Washal" sadar harokat (port dari ArabicTransliterator.kt)
 *  3. localHarokat()   -> kamus harokat offline berbasis KATA (perbaikan atas regex \b
 *     yang TIDAK PERNAH cocok dengan huruf Arab karena \w di JS hanya ASCII)
 *  4. fallback terjemahan yang JUJUR (tidak mengarang terjemahan untuk sembarang teks)
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

  // ---------- transliterasi satu kata ----------
  function transliterateWord(word) {
    var chars = word.split('');
    var skel = stripDiacritics(word);

    if (SPECIAL[skel]) return SPECIAL[skel] + trailingVowel(chars);

    var out = [];
    var i = 0, lastVowel = '', assimilated = false;

    // artikel "ال" di awal kata
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
          assimilated = true; // idgham syamsiyah
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
        base = (vowel || t.shadda) ? 't' : 'h';
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

    return out.join('');
  }

  /**
   * Transliterasi teks Arab (idealnya berharokat) -> Latin Washal.
   * Konvensi pesantren Indonesia: sy, sh, th, kh, ‘, diftong ai/au.
   */
  function transliterate(text) {
    if (!text) return '';
    var tokens = text.split(/(\s+)/);
    var out = '';
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (!tok) continue;
      if (/^\s+$/.test(tok)) {
        out += tok.indexOf('\n') >= 0 ? '\n' : ' ';
      } else {
        out += transliterateWord(tok);
      }
    }
    var s = out
      .replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .replace(/ ([,.:;!?])/g, '$1');
    // liaison tanwin + artikel: "arkaanu al-islaami" -> "arkaanul-islaami"
    s = s.replace(/(\w(?:an|in|un)) (al?-)/g, '$1$2');
    return s.trim();
  }

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
    if (!text) return { text: '', coverage: 0 };
    var arabicWords = 0, hitWords = 0;

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
        return w;
      }).join(' ');
    }).join('\n');

    var coverage = arabicWords > 0 ? hitWords / arabicWords : 0;
    return { text: result, coverage: coverage };
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
    localHarokat: localHarokat,
    localTranslation: localTranslation,
    cleanExtractedArabic: cleanExtractedArabic,
    TEST_SAMPLE: TEST_SAMPLE
  };
});
