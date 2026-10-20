/**
 * Unit test NaskahEngine — jalankan: node uji-engine.js
 * (Repo ini "type":"module", jadi tes berjalan sebagai ESM; mesin selalu
 *  tersedia di globalThis.NaskahEngine.)
 */
import './engine.js';
const E = globalThis.NaskahEngine;

let pass = 0, fail = 0;
function eq(label, got, exp) {
  const ok = got === exp;
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗') + ' ' + label + (ok ? '' : `\n    dapat : ${JSON.stringify(got)}\n    harapan: ${JSON.stringify(exp)}`));
}
function ok(label, cond, info = '') {
  cond ? pass++ : fail++;
  console.log((cond ? '✓' : '✗') + ' ' + label + (cond ? '' : '  ' + info));
}

// ---------- API ----------
['stripDiacritics', 'skeleton', 'canonMarks', 'levenshtein', 'similarity', 'isFaithful',
  'transliterate', 'WASHAL_RULES', 'localHarokat', 'localTranslation', 'MUFRADAT',
  'splitSentences', 'localSyarah', 'cleanExtractedArabic', 'TEST_SAMPLE'].forEach(k =>
  ok('API punya ' + k, typeof E[k] !== 'undefined'));

// ---------- Transliterasi (ekspektasi = hasil validasi sebelumnya) ----------
eq('basmalah', E.transliterate('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),
  'bismi Allaahi ar-rahmaani ar-rahiimi');
eq('arkanul islam', E.transliterate('فَصْلٌ أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ'),
  'fashlun arkaanu al-islaami khamsatun');
eq('hamdalah', E.transliterate('الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'),
  'al-hamdu Lillaahi rabbi al-‘aalamiina');
eq('syamsiyah syams', E.transliterate('الشَّمْسُ'), 'asy-syamsu');
eq('syamsiyah shalah', E.transliterate('الصَّلَاةِ'), 'ash-shalaati');
eq('lam tasydid', E.transliterate('الَّتِي'), 'allatii');
eq('qamariyah', E.transliterate('الْقَمَرُ'), 'al-qamaru');
eq('tasydid', E.transliterate('مُحَمَّدٌ'), 'muhammadun');
eq('ta marbuthah', E.transliterate('خَمْسَةٌ'), 'khamsatun');
eq('diftong', E.transliterate('شَيْءٌ'), "syai'un");
eq('hamzah an', E.transliterate('أَنْ'), 'an');
eq('pegon', E.transliterate('ڤڠݢ'), 'pngg');
eq('idgham dua', E.transliterate('بِسْمِ اللَّهِ'), 'bismi Allaahi');

// ---------- 3 Hukum Washal ----------
ok('WASHAL_RULES berisi tepat 3 hukum', E.WASHAL_RULES.length === 3);
ok('judul hukum 1 ta marbuthah', /Ta Marbuthah/.test(E.WASHAL_RULES[0].nama));
ok('judul hukum 2 hamzatul washl', /Hamzatul Washl/.test(E.WASHAL_RULES[1].nama));
ok('judul hukum 3 idgham al-lam', /Idgham Al-Lam/.test(E.WASHAL_RULES[2].nama));

// Hukum 1: ta marbuthah — washal "t", waqaf "h"
eq('hukum1 washal', E.transliterate('خَمْسَةٌ', 'washal'), 'khamsatun');
eq('hukum1 waqaf', E.transliterate('خَمْسَةٌ', 'waqaf'), 'khamsah');
eq('hukum1 kata قرية waqaf', E.transliterate('قَرْيَةٌ', 'waqaf'), 'qaryah');
eq('waqaf hanya di akhir kalimat', E.transliterate('كَلِمَةُ السَّمَاءِ خَمْسَةٌ', 'waqaf'), "kalimatu as-samaa'i khamsah");
eq('washal tetap t di tengah', E.transliterate('كَلِمَةُ السَّمَاءِ خَمْسَةٌ', 'washal'), "kalimatu as-samaa'i khamsatun");

// Hukum 2: hamzatul washl — gugur menyambung, dibaca saat memulai
eq('hukum2 menyambung', E.transliterate('عَلَى ابْنِهِ'), '‘alaa-bnihi');
eq('hukum2 memulai', E.transliterate('اِبْنُ أُمَرَ'), 'ibnu umara');
eq('hukum2 istafala awal', E.transliterate('اِسْتَفْعَلَ'), 'istaf‘ala');
eq('hukum2 wasl + kasrah tidak dobel', E.transliterate('اِسْمُهُ'), 'ismuhu');

// Hukum 3: idgham al-lam — 14 syamsiyah, qamariyah tetap al-
eq('hukum3 syamsiyah ra', E.transliterate('الرَّحْمَٰنِ'), 'ar-rahmaani');
eq('hukum3 syamsiyah nun', E.transliterate('النَّاسِ'), 'an-naasi');
eq('hukum3 syamsiyah tsa', E.transliterate('الثَّمَرَةِ'), 'ats-tsamarati');
eq('hukum3 qamariyah qaf', E.transliterate('الْقَمَرُ'), 'al-qamaru');
eq('hukum3 liaison tanwin', E.transliterate('فَصْلٌ الْإِسْلَامِ'), 'fashlul-islaami');

// ---------- 3 Hukum Nahwu Sharaf & pemeriksa ----------
ok('NAWHU_RULES berisi tepat 3 hukum', E.NAWHU_RULES.length === 3);
ok('judul hukum 1 fiil & isim AL tanpa tanwin', /tidak bertanwin/.test(E.NAWHU_RULES[0].nama));
ok('judul hukum 2 idhafah', /Idhafah/.test(E.NAWHU_RULES[1].nama));
ok('judul hukum 3 anna', /Anna/.test(E.NAWHU_RULES[2].nama));

const nf = E.checkNahwu(E.MUQADDIMAH_HAROKAT);
ok('teks final muqaddimah: 0 temuan (ground truth)', nf.ok && nf.temuan.length === 0, JSON.stringify(nf.temuan.slice(0, 2)));
ok('muqaddimah fixture > 500 karakter', E.MUQADDIMAH_HAROKAT.length > 500);

const n1 = E.checkNahwu('الْبَيْتٌ كَبِيرٌ');
ok('hukum1: AL+tanwin ditangkap', n1.temuan.some(t => t.hukum === 1 && t.kata === 'البيت'));
const n1b = E.checkNahwu('الْكِتَابَانِ الْجَدِيدَانِ');
ok('hukum1: muthanna tidak salah di-flag', n1b.temuan.filter(t => t.hukum === 1).length === 0);
const n2 = E.checkNahwu('فَصْلٌ الْإِسْلَامِ خَمْسَةٌ');
ok('hukum2: tanwin + AL dicurigai idhafah', n2.temuan.some(t => t.hukum === 2 && t.jenis === 'dicurigai'));
ok('hukum2: contoh perbaikan pengguna benar', E.checkNahwu('كَلِمَةُ السَّمَاءِ').ok);
const n3 = E.checkNahwu('أَنَّ مَصْدِرِ سَعَادَةٍ');
ok('hukum3: non-mansub setelah anna ditangkap', n3.temuan.some(t => t.hukum === 3 && t.kata === 'مصدر'));
ok('hukum3: anna + mansub lolos', E.checkNahwu('أَنَّ مَصْدَرَ سَعَادَةِ').ok);
ok('hukum3: أَنْ (sukun) bukan anna — tidak di-flag', E.checkNahwu('أَنْ يَمْتَلِكَ الْفَرْدُ').ok);

// ---------- Penjaga mutu ----------
ok('similarity setia > 0.9', E.similarity('فصل اركان الاسلام خمسة',
  'فَصْلٌ أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ') > 0.9);
ok('similarity menyimpang < 0.7', E.similarity('فصل اركان الاسلام خمسة',
  'فَصْلٌ فِي أَرْكَانِ الْإِسْلَامِ الْخَمْسَةِ وَهِيَ الشَّهَادَتَانِ') < 0.7);
ok('isFaithful benar', E.isFaithful('بسم الله', 'بِسْمِ اللَّهِ'));
ok('varian الالاه/الله diabaikan', E.similarity('محمد رسول الله', 'مُحَمَّدٌ رَسُولُ اللّٰه') > 0.85);

// ---------- Kamus harokat lokal ----------
const cm = E.canonMarks;
const h = E.localHarokat('اتفقت كلمة السماء والانسان');
ok('kamus kata awal kalimat', cm(h.text).includes(cm('اِتَّفَقَتْ')), h.text);
ok('kamus kata kedua', cm(h.text).includes(cm('كَلِمَةُ')), h.text);
ok('kamus kata tiga', cm(h.text).includes(cm('السَّمَاءِ')), h.text);
ok('kamus و + tanpa hamzah', cm(h.text).includes(cm('الْإِنْسَانِ')), h.text);
ok('coverage penuh untuk contoh', h.coverage === 1, String(h.coverage));

// ---------- Terjemahan offline jujur ----------
ok('terjemahan offline: hanya teks contoh', E.localTranslation(E.TEST_SAMPLE).length > 30);
ok('terjemahan offline: tolak teks lain', E.localTranslation('كتاب احكام الطهارة') === '');

// ---------- Syarah ----------
ok('splitSentences memecah kalimat Arab', E.splitSentences('فَصْلٌ. أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ!').length === 2);
const sy = E.localSyarah('فَصْلٌ أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ');
ok('syarah offline berlabel offline', sy.mode === 'offline' && /API key/.test(sy.catatan));
ok('syarah memberi arti kata (berharokat pun match)', sy.kalimat[0].kosakata[0].arti === 'fasal', JSON.stringify(sy.kalimat[0].kosakata[0]));
ok('syarah jujur untuk kata tak dikenal', sy.kalimat[0].kosakata.some(k => k.arti === null));
ok('mufradat >= 100 entri', Object.keys(E.MUFRADAT).length >= 100);

// ---------- Pembersih hasil vision ----------
ok('cleanExtractedArabic membuang harokat', E.cleanExtractedArabic('بِسْمِ اللَّهِ') === 'بسم الله');
ok('cleanExtractedArabic buang pengantar', E.cleanExtractedArabic('Berikut teksnya:\nفصل اركان') === 'فصل اركان');

console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
