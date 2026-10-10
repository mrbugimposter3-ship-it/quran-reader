const API = 'https://api.alquran.cloud/v1';
const EDITIONS = 'quran-uthmani,en.transliteration,ur.jalandhry,en.sahih';

const cache = new Map();

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function stripBismillah(text) {
  // The uthmani edition prefixes ayah 1 of each surah (except 1 & 9) with bismillah.
  if (text.startsWith(BISMILLAH)) return text.slice(BISMILLAH.length).trim();
  return text;
}

function mergeEditions(editions, surahNumber) {
  // editions: [arabic, transliteration, urdu, english]
  const [ar, tr, ur, en] = editions;
  return ar.ayahs.map((a, i) => {
    const s = a.surah?.number ?? surahNumber;
    return {
    number: a.number,
    numberInSurah: a.numberInSurah,
    surah: s,
    surahName: a.surah?.englishName,
    surahArabic: a.surah?.name,
    juz: a.juz,
    ar: a.numberInSurah === 1 && s !== 1 && s !== 9
      ? stripBismillah(a.text)
      : a.text,
    tr: tr.ayahs[i]?.text ?? '',
    ur: ur.ayahs[i]?.text ?? '',
    en: en.ayahs[i]?.text ?? '',
    };
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.status || 'API error');
  return json.data;
}

/** Returns flat array of ayahs for a surah: {number, numberInSurah, ar, tr, ur, en} */
export async function fetchSurah(n) {
  const key = `s${n}`;
  if (cache.has(key)) return cache.get(key);
  const p = fetchJson(`${API}/surah/${n}/editions/${EDITIONS}`)
    .then((editions) => mergeEditions(editions, n))
    .catch((e) => { cache.delete(key); throw e; });
  cache.set(key, p);
  return p;
}

/** Returns [{surah, surahName, surahArabic, ayahs:[...]}] groups for a juz */
export async function fetchJuz(n) {
  const key = `j${n}`;
  if (cache.has(key)) return cache.get(key);
  const p = fetchJson(`${API}/juz/${n}/editions/${EDITIONS}`).then((editions) => {
    const merged = mergeEditions(editions);
    const groups = [];
    for (const ayah of merged) {
      const last = groups[groups.length - 1];
      if (!last || last.surah !== ayah.surah) {
        groups.push({ surah: ayah.surah, surahName: ayah.surahName, surahArabic: ayah.surahArabic, ayahs: [ayah] });
      } else {
        last.ayahs.push(ayah);
      }
    }
    return groups;
  }).catch((e) => { cache.delete(key); throw e; });
  cache.set(key, p);
  return p;
}

/** Warm the cache for the next surah so reading continues instantly */
export function prefetchSurah(n) {
  if (n >= 1 && n <= 114) fetchSurah(n).catch(() => {});
}
