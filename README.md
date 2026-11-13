# Dramatone Studio 🎛️✨
### Real-Time Adaptive Soundscapes & DAW MIDI Studio for Indie Creators & Game Developers

**Dramatone Studio** is a browser-based, AI-assisted Digital Audio Workstation (DAW) that empowers **indie game developers, filmmakers, and podcasters** to compose, sync, and export real-time adaptive soundscapes tailored to dynamic emotional pacing.

---

## 💡 The Problem & The Solution

- **The Problem:** Independent creators lack affordable, zero-latency adaptive soundscapes that dynamically follow video cuts, scene pacing, and emotional tension. Heavy AI diffusion models require expensive cloud GPUs, suffer 15–40s latency, output uneditable flat audio, and crash on low-spec hardware.
- **The Solution:** Dramatone unites an **in-house Web Audio API procedural synthesis engine** with **video motion-to-tension tracking**, **smart speech ducking**, a **64-step DAW Piano Roll with Web MIDI hardware support**, and **enterprise-grade MongoDB authentication & project persistence**. It runs completely offline with <5% CPU usage even on an Intel Core i3 laptop.

---

## ✨ Key Features & Capabilities

### 1. 🎹 DAW Roll & MIDI Studio (64-Step Grid + Raw Voices)
- **64-Step Multi-Octave Piano Roll:** Full 4-measure 16th-note timeline (C3–C5, 25 playable keys) eliminating 2-bar loop limits.
- **Web MIDI Hardware Support:** Plug-and-play support for any USB or Bluetooth MIDI controller keyboard, with real-time input status, velocity sensitivity, and note recording.
- **9 Dedicated Raw Studio Voices (Direct Master Bus):**
  - 🎹 **Grand Piano (`keys`)**: Multi-harmonic acoustic timbre + wooden hammer strike transient click.
  - ✨ **Rhodes Electric Piano (`epiano`)**: Warm sine fundamental + metallic bell chime overtone (Neo-Soul / Lo-Fi).
  - 🎺 **Solo Trumpet (`trumpet`)**: Sawtooth wave + dynamic brass formant filter sweep + delayed 5.5Hz vibrato.
  - 🎻 **Violin / Strings (`strings`)**: Dual detuned saw waves (-8/+8 cents) with soft bow friction attack.
  - 🎸 **Acoustic Guitar (`guitar`)**: Crisp finger-pluck transient + rapid lowpass string damping envelope.
  - 🔊 **808 Sub-Bass (`bass`)**: Punchy pitch dive into deep sub fundamental (30–65 Hz).
  - 🍃 **Concert Flute (`flute`)**: Pure sine + natural 5.0 Hz vibrato + breath swell envelope.
  - ⚡ **Analog Synth (`synth`)**: Cyberpunk square wave lead with resonant 4.2 Q lowpass filter envelope.
  - 🥁 **Drum Kit & Foley (`percussion`)**: Intelligently pitch-mapped (C3–F3: 808 Kick, F#3–F4: Snappy Snare, F#4–C5: Hi-Hat/Click).
- **Decoupled Architecture:** Score presets (*Dark Cinematic, Trumpet Fanfare, Lo-Fi Chill, Cyberpunk Pulse, Ambient Drone*) only populate note patterns onto the grid, leaving your chosen raw instrument voice completely independent.
- **Follow Slider:** Automatic smooth auto-scroll keeps the viewport aligned with the playhead in real time.

### 2. 🎬 Video-Synced Motion & Scene Pacing
- **Lightweight Optical Motion Analyzer:** Canvas video sampler running at 4 FPS analyzes luminance and pixel differencing with <0.5% CPU load.
- **Dynamic Tension Automation:** Automatically steers music tension (15%–100%), opening master filter cutoffs, adding staccato pulses, sub-bass drones, and tension risers.
- **Clean Slate on Upload:** Uploading a video automatically unmutes the video's original audio track, resets previous compositions, and prevents leftover synthetic loops from playing behind the clip.
- **Independent Audio Layer Controls:** Dedicated toolbar buttons to independently toggle and balance **Original Video Audio** and **AI Background Score**.

### 3. 🎙️ Smart Dialogue Ducking & Master Brickwall Limiter
- **Speech Auto-Ducking:** Automatically sidechains background stems (-8dB attenuation) whenever dialogue or voiceover occurs, ensuring crystal-clear spoken words.
- **DAC Protection Limiter:** DynamicsCompressor node (-1.0 dB threshold, 20:1 ratio, 2ms attack) prevents digital clipping and audio blasting even during dense polyphonic climaxes.
- **64-Band Real-Time Spectrogram:** Direct FFT frequency visualizer powered by `AnalyserNode` frequency bin smoothing.

### 4. 🎮 Indie Game Engine & Film Export
- **Offline WAV Rendering:** One-click stereo 44.1kHz `.wav` stem export rendered via `OfflineAudioContext`, protected with a 01:45 maximum duration cap.
- **Game Engine JSON:** Exports `game-soundscape.json` mapping tension thresholds (`idle`, `suspense`, `combat`, `boss`) directly into Unity, Godot, or FMOD.

### 5. 🛡️ Enterprise Authentication, Security & OTP Verification
- **Email OTP Verification:** Mandatory 6-digit one-time password verification before account creation with 60-second resend cooldown and 10-minute expiration.
- **Disposable Email Blacklist:** Strict domain filter blocking temporary and throwaway email addresses (10minutemail, guerrillamail, tempmail, mailinator, etc.).
- **Forgot Password Security:** Verifies user existence in database before generating recovery codes, preventing unauthorized account creation via password reset.
- **Superuser Protection & RBAC:**
  - The default Dramatone superuser (`admin@dramatone.ai`) has hardcoded immunity against deletion or demotion.
  - Superusers can promote other registered users to superusers directly from the Settings console.
- **Resilient Fallback Mode:** Node.js + MongoDB backend with automatic local browser storage caching if the backend is offline.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion |
| **Audio DSP** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`, `DynamicsCompressorNode`, `OfflineAudioContext`) |
| **Hardware MIDI** | Web MIDI API (`navigator.requestMIDIAccess`) |
| **Video Engine** | HTML5 Canvas Video Sampler (Ultra-low CPU 4 FPS motion/cut differencing) |
| **Backend** | Node.js (ESM), Express, Mongoose, JWT, bcryptjs, Nodemailer (Brevo SMTP) |
| **Database** | MongoDB (Atlas or Local) + Automatic LocalStorage Fallback |

---

## 📂 Project Structure

```text
Dramatone/
├── backend/                        # Node.js + Express API
│   ├── src/
│   │   ├── models/                 # User.js (RBAC & OTP state) & Project.js
│   │   ├── routes/                 # auth.js (OTP, Superuser protection, TempMail check) & projects.js
│   │   └── server.js               # Express entrypoint
│   ├── .env.example                # SMTP, MongoDB, and JWT configuration template
│   └── package.json
├── frontend/                       # React + Vite DAW & Audio Studio
│   ├── src/
│   │   ├── app/                    # App entrypoint & route guards
│   │   ├── components/
│   │   │   ├── daw/                # DawPianoRoll.tsx (64-step grid, Web MIDI, 9 raw voices)
│   │   │   └── layout/             # MainLayout.tsx, Sidebar.tsx (edge-to-edge 100dvh)
│   │   ├── features/               # generationService.ts, soundscapeService.ts
│   │   ├── pages/                  # DashboardPage, DawPage, MusicGeneratorPage, SettingsPage, etc.
│   │   ├── services/
│   │   │   ├── audioEngine.ts      # Web Audio DSP graph, raw synthesizers & limiter
│   │   │   ├── videoAnalysisService.ts # Optical motion & dialogue ducking
│   │   │   └── apiClient.ts        # MongoDB API connector with offline fallback
│   │   └── styles/                 # Tailwind CSS & theme tokens
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
├── package.json
├── start.js                        # Cross-platform runner script
└── README.md
```

---

## 🚀 Quick Start (Cross-Platform: Windows, macOS & Linux)

### 1. Prerequisites
- **Node.js** v18+ and **npm** installed.
- (Optional) **MongoDB** instance or free MongoDB Atlas URI.

### 2. Environment Configuration
Copy the backend environment template:
```bash
cp backend/.env.example backend/.env
```
Key configuration values in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dramatone?retryWrites=true&w=majority
JWT_SECRET=dramatone_hackathon_super_secret_jwt_key_2026
DEFAULT_USER=admin@dramatone.ai
DEFAULT_PASSWORD=BWU/bca/25@

# Brevo (Sendinblue) Transactional Email SMTP Relay
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_smtp_user@smtp-brevo.com
BREVO_SMTP_KEY=your_brevo_smtp_key_here
BREVO_SENDER_EMAIL=your_verified_sender@domain.com
BREVO_SENDER_NAME=DRAMATONE-STUDIO.AI
OTP_COOLDOWN_SECONDS=60
```
*(Note: If no SMTP credentials are configured, Dramatone automatically logs the 6-digit OTP code directly to the backend terminal for seamless local development).*

### 3. Run Everything (One Command)
Automatically verifies/installs dependencies and starts both Frontend & Backend concurrently:
```bash
npm run dev
# or: npm start
```
- **Frontend Studio:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

### 4. Run Individually
To run only the Frontend:
```bash
npm run frontend
```

To run only the Backend:
```bash
npm run backend
```

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Master Play / Pause toggle |
| `0` | Rewind playhead to beginning / Trim In point |
| `L` | Toggle timeline loop playback |
| `A`–`K` | Computer keyboard piano input in DAW Roll |
| USB / Bluetooth MIDI | Native hardware note triggering and recording |

---

## 📄 License
MIT License. Built for the Hackathon 2026.
