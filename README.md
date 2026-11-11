# Dramatone Studio 🎛️✨

**Dramatone Studio** is a browser-based, AI-assisted music production interface and Digital Audio Workstation (DAW) environment built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

It unites real-time audio visualization, multi-stem sound design, and an integrated video preview canvas to let producers, composers, and sound designers score, arrange, and audition music directly in sync with visual media.

---

## ✨ Features

- **Full-Viewport Edge-to-Edge Workspace:** Immersive, responsive layout engineered for distraction-free DAW workflows with no wasted screen margins.
- **Persistent NLE-Style Video Monitor:** Fixed upper-right preview canvas supporting reference video playback, timecode tracking (`TC 00:00:00`), quick aspect ratio toggles (`16:9`, `9:16`, `1:1`), playback rate adjustments (`0.5x`–`2x`), brightness/contrast filters, and in/out point trimming.
- **Multi-Stem Audio Arrangement:** Interactive track lanes for stems (*Dramatone Keys*, *Neural Drums*, *Acoustic Pluck*, and *Vocal Texture*) featuring Mute (`M`), Solo (`S`), and playhead scrubbing.
- **Waveform & Spectrogram Feedback:** Real-time traveling sine-wave and frequency-bin animations that react dynamically to master output levels.
- **Functional Master Rack Controls:**
  - **Stereo Width / Spatial Balance:** Modulate between mono centering and wide stereo field separation.
  - **Master Output Gain:** Live control over amplitude heights with single-click master bypass/mute.
- **Dual Visual Themes:**
  - **Dark Mode:** Deep neon graphite (`#0d0c11`) with vibrant amber and orange syntax highlights.
  - **Light Mode:** Iridescent frosted pastel glass (`#e7c6d9` → `#dfd6eb` → `#cbe0e4`) accented by clean indigo and violet controls.
- **Dedicated Modular Views:** Quick routing between **Studio Workspace**, **Music Generator**, **Adaptive Soundscape**, **Audio Analysis**, **Music Library**, **Projects**, and **Settings**.

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management & Routing:** Custom lightweight reactive component state & modular view routing

---

## 📂 Project Structure

```text
music-audio-studio/
├── public/                 # Static assets (favicons, SVGs, audio references)
├── src/
│   ├── app/                # App entry point, shell & routing configuration
│   ├── assets/             # Project-bundled audio, icons, and artwork
│   ├── components/
│   │   ├── common/         # Loaders, error boundaries, and empty states
│   │   ├── layout/         # MainLayout, Sidebar, and Navbar
│   │   └── ui/             # Reusable UI atoms (Buttons, Cards, Modals, Sliders)
│   ├── config/             # Navigation and application constants
│   ├── features/           # Domain-specific modules:
│   │   ├── adaptive-soundscape/
│   │   ├── audio-analysis/
│   │   ├── audio-player/
│   │   ├── music-generator/
│   │   └── music-library/
│   ├── hooks/              # Custom audio and utility hooks (useAudio, useDebounce)
│   ├── pages/              # View pages (Dashboard, Generator, SoundscapeAnalysis, etc.)
│   ├── services/           # API and WebSocket streaming connectors
│   ├── store/              # Global state management stores
│   ├── styles/             # Tailwind imports, theme tokens, and custom animations
│   ├── types/              # TypeScript interfaces and route declarations
│   └── utils/              # Audio math, time formatting, and file helpers
├── .env.example            # Environment variable template
├── .gitignore              # Ignored build, cache, and credential files
├── package.json
├── tsconfig.json
└── vite.config.ts