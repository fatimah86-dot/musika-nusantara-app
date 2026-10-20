require('/home/user/musika-nusantara-app/garshuni-studio/naskah-engine.js');
const E = (typeof globalThis !== 'undefined' && globalThis.NaskahEngine)
       || require('/home/user/musika-nusantara-app/garshuni-studio/naskah-engine.js');
const cm = E.canonMarks;
let pass = 0, fail = 0;
function eq(label, got, exp) {
  const ok = got === exp;
  ok ? pass++ : fail++;
  console.log((ok ? '✓' : '✗') + ' ' + label + (ok ? '' : `\n    dapat : ${JSON.stringify(got)}\n    harapan: ${JSON.stringify(exp)}`));
}
function ok(label, cond, info='') {
  cond ? pass++ : fail++;
  console.log((cond ? '✓' : '✗') + ' ' + label + (cond ? '' : '  ' + info));
}

// --- struktur API ---
['stripDiacritics','skeleton','levenshtein','similarity','isFaithful','transliterate',
 'localHarokat','localTranslation','cleanExtractedArabic','TEST_SAMPLE'].forEach(k =>
  ok('API punya ' + k, typeof E[k] !== 'undefined'));

// --- transliterasi (ekspektasi = hasil validasi Python/Kotlin) ---
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

// --- penjaga mutu ---
ok('similarity setia > 0.9', E.similarity('فصل اركان الاسلام خمسة',
   'فَصْلٌ أَرْكَانُ الْإِسْلَامِ خَمْسَةٌ') > 0.9);
ok('similarity menyimpang < 0.7', E.similarity('فصل اركان الاسلام خمسة',
   'فَصْلٌ فِي أَرْكَانِ الْإِسْلَامِ الْخَمْسَةِ وَهِيَ الشَّهَادَتَانِ') < 0.7);
ok('isFaithful benar', E.isFaithful('بسم الله', 'بِسْمِ اللَّهِ'));
ok('varian الالاه/الله diabaikan', E.similarity('محمد رسول الله', 'مُحَمَّدٌ رَسُولُ اللّٰه') > 0.85);

// --- kamus harokat lokal (bug \\b lama: kata di awal kalimat tak pernah cocok) ---
const h = E.localHarokat('اتفقت كلمة السماء والانسان');
ok('kamus menangkap kata awal kalimat', cm(h.text).includes(cm('اِتَّفَقَتْ')), h.text);
ok('kamus kata kedua', cm(h.text).includes(cm('كَلِمَةُ')), h.text);
ok('kamus kata tiga', cm(h.text).includes(cm('السَّمَاءِ')), h.text);
ok('kamus الالسان (و tergabung + tanpa hamzah)', cm(h.text).includes(cm('الْإِنْسَانِ')), h.text);
console.log('  → hasil kamus:', h.text, '| coverage:', h.coverage.toFixed(2));

// --- fallback terjemahan jujur ---
ok('terjemahan offline: hanya untuk contoh', E.localTranslation(E.TEST_SAMPLE).length > 30);
ok('terjemahan offline: tolak teks lain', E.localTranslation('كتاب احكام الطهارة') === '');

// --- pembersih hasil vision ---
ok('cleanExtractedArabic membuang harokat', E.cleanExtractedArabic('بِسْمِ اللَّهِ') === 'بسم الله');
ok('cleanExtractedArabic buang pengantar', E.cleanExtractedArabic('Berikut teksnya:\nفصل اركان') === 'فصل اركان');

console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
