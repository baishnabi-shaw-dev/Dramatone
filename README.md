# Dramatone Studio 🎛️✨
### Real-Time Adaptive Soundscapes for Indie Creators & Game Developers

**Dramatone Studio** is a browser-based, AI-assisted Digital Audio Workstation (DAW) that empowers **indie game developers, filmmakers, and podcasters** to compose, sync, and export real-time adaptive soundscapes tailored to dynamic emotional pacing.

---

## 💡 The Problem & The Solution

- **The Problem:** Independent creators lack affordable, zero-latency adaptive soundscapes that dynamically follow video cuts, scene pacing, and emotional tension. Heavy AI models require expensive cloud GPUs, suffer high latency, and crash on low-spec laptops.
- **The Solution:** Dramatone unites an **in-house Web Audio API procedural synthesis engine** with **video motion-to-tension tracking**, **smart speech ducking**, and **MongoDB project persistence**. It runs completely offline with <5% CPU usage even on an Intel Core i3 laptop.

---

## ✨ Key Features

1. **In-House Procedural Audio Engine (0ms Latency, Zero Quota):**
   - Synthesizes 4 distinct stem channels (*Ambient Pad, Neural Drums, Melodic Pluck, Foley FX/Riser*) natively in the browser.
   - Dynamic real-time parameter modulation: dragging the Tension slider (0%–100%) shifts filter cutoffs, tempo drive, and stem density instantly.
2. **Video-Synced Motion & Scene Pacing:**
   - Upload any reference video clip. An ultra-lightweight optical motion analyzer detects scene cuts and movement energy, automatically steering the audio tension curve.
3. **Smart Dialogue Ducking & Speech EQ:**
   - Prevents music from drowning out video dialogue by sidechaining stem gains when speech is detected (-8dB ducking) with vocal frequency carve.
4. **Real-Time FFT Spectrogram Visualizer:**
   - 64-band frequency spectrum and transient waveform driven directly by live browser `AnalyserNode` audio data.
5. **Indie Game Engine & Film Export:**
   - One-click `.wav` stems export rendered via browser `OfflineAudioContext`.
   - Exports `game-soundscape.json` mapping tension thresholds (`idle`, `suspense`, `combat`, `boss`) directly into Unity, Godot, or FMOD.
6. **User Authentication & Cloud Projects (MongoDB):**
   - User Sign Up and Login via Node.js + Express backend with hashed passwords (bcrypt) and JWT auth.
   - Saves multi-stem studio sessions to MongoDB with an **automatic zero-fail offline fallback** (`localStorage`) for seamless hackathon presentations.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion |
| **Audio DSP** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`, `OfflineAudioContext`) |
| **Video Engine** | HTML5 Canvas Video Sampler (Ultra-low CPU 4 FPS motion/cut differencing) |
| **Backend** | Node.js, Express, Mongoose, JWT, bcryptjs, CORS |
| **Database** | MongoDB (Atlas or Local) + Automatic LocalStorage Fallback |

---

## 📂 Project Structure

```text
Dramatone/
├── backend/                        # Node.js + Express API
│   ├── src/
│   │   ├── models/                 # User.js & Project.js (Mongoose schemas)
│   │   ├── routes/                 # auth.js & projects.js
│   │   └── server.js               # Express entrypoint
│   └── package.json
├── frontend/                       # React + Vite DAW & Audio Studio
│   ├── public/                     # Static media & icons
│   ├── src/
│   │   ├── app/                    # App entrypoint & routing
│   │   ├── components/layout/      # MainLayout, Sidebar, Navbar
│   │   ├── features/               # Domain audio & generator modules
│   │   ├── pages/                  # Studio, Generator, Soundscape, Analysis, Projects
│   │   ├── services/
│   │   │   ├── audioEngine.ts       # Web Audio API synthesizers & DSP graph
│   │   │   ├── videoAnalysis.ts    # Optical motion & dialogue ducking
│   │   │   └── apiClient.ts        # MongoDB API connector with offline fallback
│   │   └── styles/                 # Tailwind CSS & theme tokens
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Cross-Platform: Windows, macOS & Linux)

### 1. Run Everything (One Command)
Automatically verifies/installs dependencies and starts both Frontend & Backend concurrently:
```bash
npm run dev
# or: npm start
```
- **Frontend Studio:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

### 2. Run Individually
To run only the Frontend:
```bash
npm run frontend
```

To run only the Backend:
```bash
npm run backend
```
*Note: If the backend is not running, Dramatone automatically operates in **Offline Studio Mode**, seamlessly caching your accounts and projects in local browser storage.*