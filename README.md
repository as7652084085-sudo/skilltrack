# SkillTrack

A mobile-first, bilingual (English / हिंदी) skills coach for Class 1–8 students. SkillTrack combines reading fluency practice, creative writing (alekh), vocabulary building and a parent-facing progress dashboard in a single offline-friendly React app.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Production build:

```bash
npm run build
npm run preview
```

> On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Deploy to Vercel

The repository is ready for Vercel's Vite preset:

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Keep the detected settings, or set **Build Command** to `npm run build` and **Output Directory** to `dist`.
3. Deploy. Vercel serves the app over HTTPS, which is required for PWA install prompts, microphone access and service workers.

`vercel.json` keeps `sw.js` and `manifest.json` revalidated, gives hashed assets an immutable cache, and routes app paths back to `index.html`.

### PWA install & updates

- The web app manifest and 192/512 px icons make SkillTrack installable from Android Chrome/Edge and desktop browsers.
- Brand artwork lives in `public/logo.png`; `public/icon-192.png`, `public/icon-512.png`, `public/maskable-*.png`, `public/apple-touch-icon.png` and `public/favicon.*` are generated from it. Icon URLs use a `?v=3` cache-busting query.
- On iPhone/iPad, use Safari's **Share → Add to Home Screen** flow shown inside the app.
- The service worker caches the app shell for offline use, activates updates immediately, and refreshes the app automatically after a new deployment without interrupting an in-progress reading test.

## Modules

- **Read** – 32 bilingual passages (2 per class per language). Tap any word for pronunciation, take a live microphone reading test with word-by-word highlighting, or use the self-check fallback. Tracks WPM, accuracy and CWPM, and saves tricky words.
- **Write** – 32 bilingual writing prompts (2 per class per language), class-specific word targets, live word counting, golden-word detection, read-aloud playback, autosaved drafts and timestamped essay history.
- **Vocab** – 80 bilingual word cards (5 per class per language) with meanings, examples and audio. A 3-question quiz moves correct words to the mastered shelf.
- **Track** – Daily goal, streak, reading/writing/vocabulary skill cards, weekly SVG chart, recent activity and a printable/downloadable parent & teacher report.

## Data & privacy

All profile, draft and progress data stays in `localStorage` on the device. No account, server or external database is used. Clearing browser storage removes the saved profile and progress.

## Browser notes

- Live speech recognition works best in current Chrome/Edge. The app automatically offers the self-check mode when speech recognition is unavailable.
- Text-to-speech uses the device voices for `en-IN` and `hi-IN`.
- The parent report can be downloaded as a text file, copied as a summary, or printed via the browser print dialog.
