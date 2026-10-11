import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SURAHS, AYAH_PER_JUZ } from './surahMeta.js';
import { fetchSurah, fetchJuz, prefetchSurah } from './quranApi.js';
import { toHieroglyphs } from './hieroglyphs.js';

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export default function App() {
  const [mode, setMode] = useState(() => load('qr.mode', 'surah'));
  const [surah, setSurah] = useState(() => load('qr.surah', 1));
  const [juz, setJuz] = useState(() => load('qr.juz', 1));
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fontSize, setFontSize] = useState(() => load('qr.font', 60));    // Arabic px, standard 60
  const [minPerJuz, setMinPerJuz] = useState(() => load('qr.speed', 15)); // autoscroll pace
  const [playing, setPlaying] = useState(false);
  const [continuous, setContinuous] = useState(() => load('qr.continuous', true));
  const [theme, setTheme] = useState(() => load('qr.theme', 'dark'));
  const [layers, setLayers] = useState(() => ({ hg: true, ar: true, tr: true, ur: true, en: true, ...load('qr.layers', {}) }));
  const [showSettings, setShowSettings] = useState(false);

  const contentRef = useRef(null);
  const stateRef = useRef({ playing, minPerJuz, mode, surah, continuous });
  stateRef.current = { playing, minPerJuz, mode, surah, continuous };

  // ---------- data loading ----------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load$ = mode === 'surah'
      ? fetchSurah(surah).then((ayahs) => {
          const meta = SURAHS[surah - 1];
          return [{ surah, surahName: meta[2], surahArabic: meta[1], ayahs }];
        })
      : fetchJuz(juz);
    load$
      .then((g) => {
        if (cancelled) return;
        setGroups(g);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (mode === 'surah') prefetchSurah(surah + 1);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, surah, juz]);

  const retry = () => {
    // bump state to retrigger the loading effect
    setGroups(null);
    if (mode === 'surah') setSurah((s) => s);
    else setJuz((j) => j);
    // force refetch even if state didn't change:
    setLoading(true);
    setError(null);
    const load$ = mode === 'surah'
      ? fetchSurah(surah).then((ayahs) => {
          const meta = SURAHS[surah - 1];
          return [{ surah, surahName: meta[2], surahArabic: meta[1], ayahs }];
        })
      : fetchJuz(juz);
    load$
      .then((g) => { setGroups(g); setLoading(false); window.scrollTo({ top: 0 }); })
      .catch((e) => { setError(e.message || 'Failed to load'); setLoading(false); });
  };

  // ---------- persistence ----------
  useEffect(() => save('qr.mode', mode), [mode]);
  useEffect(() => save('qr.surah', surah), [surah]);
  useEffect(() => save('qr.juz', juz), [juz]);
  useEffect(() => save('qr.font', fontSize), [fontSize]);
  useEffect(() => save('qr.speed', minPerJuz), [minPerJuz]);
  useEffect(() => save('qr.continuous', continuous), [continuous]);
  useEffect(() => save('qr.theme', theme), [theme]);
  useEffect(() => save('qr.layers', layers), [layers]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // ---------- autoscroll ----------
  const measurePxPerJuz = useCallback(() => {
    const el = contentRef.current;
    if (!el) return 24000;
    const ayahCount = el.querySelectorAll('.ayah').length;
    if (!ayahCount) return 24000;
    return (el.scrollHeight / ayahCount) * AYAH_PER_JUZ;
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    let carry = 0;
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = stateRef.current;
      const pxPerSec = measurePxPerJuz() / (s.minPerJuz * 60);
      carry += pxPerSec * dt;
      const whole = Math.floor(carry);
      if (whole > 0) {
        carry -= whole;
        window.scrollBy(0, whole);
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (atBottom) {
        if (s.continuous && s.mode === 'surah' && s.surah < 114) {
          setSurah((v) => Math.min(114, v + 1));
        } else if (s.continuous && s.mode === 'juz') {
          setJuz((v) => (v < 30 ? v + 1 : 1));
        } else {
          setPlaying(false);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, measurePxPerJuz]);

  // Pause auto-scroll when the user scrolls manually
  useEffect(() => {
    if (!playing) return undefined;
    const stop = () => setPlaying(false);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchmove', stop, { passive: true });
    return () => {
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
    };
  }, [playing]);

  const ayahTotal = useMemo(
    () => (groups ? groups.reduce((n, g) => n + g.ayahs.length, 0) : 0),
    [groups]
  );

  const toggleLayer = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  const selectValue = mode === 'surah' ? surah : juz;
  const onSelect = (v) => {
    const n = Number(v);
    if (mode === 'surah') setSurah(n);
    else setJuz(n);
  };
  const step = (dir) => {
    if (mode === 'surah') setSurah((v) => Math.min(114, Math.max(1, v + dir)));
    else setJuz((v) => Math.min(30, Math.max(1, v + dir)));
  };

  return (
    <div className="app" style={{ '--arabic-size': `${fontSize}px` }}>
      <header className="appbar">
        <div className="brand">
          <span className="brand-ar">القرآن الكريم</span>
          <span className="brand-sub">Quran Reader</span>
        </div>
        <button
          className={`fab-play ${playing ? 'playing' : ''}`}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause auto-scroll' : 'Start auto-scroll'}
          title={playing ? 'Pause auto-scroll' : 'Start auto-scroll'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
      </header>

      <div className="toolbar">
        <div className="seg">
          <button className={mode === 'surah' ? 'active' : ''} onClick={() => setMode('surah')}>Surah</button>
          <button className={mode === 'juz' ? 'active' : ''} onClick={() => setMode('juz')}>Juz</button>
        </div>

        <div className="picker">
          <button className="nav" onClick={() => step(-1)} aria-label="Previous">‹</button>
          <select value={selectValue} onChange={(e) => onSelect(e.target.value)}>
            {mode === 'surah'
              ? SURAHS.map(([n, ar, en]) => (
                  <option key={n} value={n}>{n}. {en} — {ar}</option>
                ))
              : Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
                ))}
          </select>
          <button className="nav" onClick={() => step(1)} aria-label="Next">›</button>
        </div>

        <div className="chips">
          <button className={`chip ${layers.hg ? 'on' : ''}`} onClick={() => toggleLayer('hg')} title="Hieroglyphic transliteration">𓂀 Glyphs</button>
          <button className={`chip ${layers.ar ? 'on' : ''}`} onClick={() => toggleLayer('ar')}>عربي</button>
          <button className={`chip ${layers.tr ? 'on' : ''}`} onClick={() => toggleLayer('tr')}>Translit</button>
          <button className={`chip ${layers.ur ? 'on' : ''}`} onClick={() => toggleLayer('ur')}>اردو</button>
          <button className={`chip ${layers.en ? 'on' : ''}`} onClick={() => toggleLayer('en')}>English</button>
        </div>

        <button className="gear" onClick={() => setShowSettings((s) => !s)} aria-label="Settings">⚙</button>
      </div>

      {showSettings && (
        <div className="settings">
          <label className="slider-row">
            <span>Font size <b>{fontSize}px</b></span>
            <input type="range" min="24" max="110" step="1" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))} />
          </label>
          <label className="slider-row">
            <span>Auto-scroll <b>{minPerJuz} min/juz</b></span>
            <input type="range" min="3" max="60" step="1" value={minPerJuz}
              onChange={(e) => setMinPerJuz(Number(e.target.value))} />
          </label>
          <label className="check-row">
            <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
            <span>Continue to next {mode === 'surah' ? 'surah' : 'juz'} automatically</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={theme === 'light'} onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')} />
            <span>Light theme</span>
          </label>
        </div>
      )}

      <main className="content" ref={contentRef}>
        {loading && <div className="status">Loading…</div>}
        {error && (
          <div className="status error">
            <p>Could not load Quran data ({error}).</p>
            <p>Check your internet connection, then <button className="retry" onClick={retry}>retry</button>.</p>
          </div>
        )}
        {!loading && !error && groups?.map((g) => (
          <section key={`${g.surah}-${g.ayahs[0]?.numberInSurah}`} className="surah-block">
            <div className="surah-head">
              <span className="surah-name-ar">{g.surahArabic}</span>
              <span className="surah-name-en">Surah {g.surah} · {g.surahName}</span>
            </div>
            {g.surah !== 1 && g.surah !== 9 && g.ayahs[0]?.numberInSurah === 1 && (
              <>
                <p className="bismillah">{BISMILLAH}</p>
                {layers.hg && <p className="hg hg-bismillah" dir="rtl" lang="egy">{toHieroglyphs('بسم الله الرحمن الرحيم')}</p>}
              </>
            )}
            {g.ayahs.map((a) => (
              <article key={a.number} className="ayah">
                {layers.ar && (
                  <p className="ar" dir="rtl" lang="ar">
                    {a.ar}
                    <span className="ayah-num"> ﴿{a.numberInSurah}﴾</span>
                  </p>
                )}
                {layers.hg && <p className="hg" dir="rtl" lang="egy" title="Hieroglyphic transliteration (consonantal)">{toHieroglyphs(a.ar)}</p>}
                {layers.tr && <p className="tr" dir="ltr">{a.tr}</p>}
                {layers.ur && <p className="ur" dir="rtl" lang="ur">{a.ur}</p>}
                {layers.en && <p className="en" dir="ltr">{a.en}</p>}
              </article>
            ))}
          </section>
        ))}
        {!loading && !error && groups && (
          <div className="status end">
            {mode === 'surah'
              ? (surah < 114 ? `End of Surah ${surah} — ${ayahTotal} ayahs` : 'End of the Quran — تقبل الله منا ومنكم')
              : `End of Juz ${juz}`}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Arabic · Transliteration · Urdu (Jalandhry) · English (Saheeh Intl) via <a href="https://alquran.cloud" target="_blank" rel="noreferrer">AlQuran Cloud API</a></span>
      </footer>
    </div>
  );
}
