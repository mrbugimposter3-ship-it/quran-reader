# Quran Reader — القرآن الكريم

A fast, green-themed, fully responsive Quran reader built with React + Vite.

## Features

- **Full Quran** — all 114 surahs / 30 juz, browse by surah or by juz
- **Five text layers** (toggle each): Arabic (Uthmani), hieroglyphic rendering, transliteration, Urdu (Jalandhry), English (Saheeh International)
- **Hieroglyphics** — note: hieroglyphs encode Ancient Egyptian, and no hieroglyphic Quran *translation* exists. This layer is a phonetic transliteration of each ayah into Egyptian uniliteral signs (Gardiner standard), with short vowels omitted — exactly how Egyptian itself was written. Rendered with the Noto Sans Egyptian Hieroglyphs font.
- **Adjustable font size** — standard/default 60px, slider from 24–110px
- **Adjustable auto-scroll** — paced in minutes per juz, default **15 min/juz** (3–60 range)
- **Continuous mode** — automatically continues to the next surah/juz
- **Responsive** — phone, iPad/tablet, and desktop monitor layouts
- **Dark & light green themes**, settings persist in localStorage
- **Fast** — ~74 KB gzipped app; Quran text fetched per surah/juz from the
  [AlQuran Cloud API](https://alquran.cloud) and cached in memory

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build     # outputs static site to dist/
npm run preview   # serve the production build locally
```

## Deploy to GitHub Pages

Automatic: every push to `main` runs `.github/workflows/deploy.yml`, which builds
and publishes to GitHub Pages (repo **Settings → Pages → Source: GitHub Actions**).

Manual alternative:

```bash
npm run deploy    # builds and pushes dist/ to the gh-pages branch
```
