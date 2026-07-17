# LYRIA ENGINE — MASTER BUILD PROMPT (LOVABLE)

> **Paste this entire document into Lovable to build the app.**
> Then iterate phase-by-phase using the build order in §9.

---

## ⟁ IDENTITY LOCK

**App name:** LYRIA ENGINE
**Position in WIRED CHAOS:** Generation layer beneath 33.3FM × OAC × ATV.
**Tagline:** `GENERATE · PERFORM · SCORE · OWN`
**Mission:** Three Lyria-powered creator surfaces in one app — Studio (text-to-music), Rhythm (beatmap game), Score-Video (auto-soundtracking video). Every output auto-creates an OAC mint draft so creators bypass DistroKid in one click.

**Brand parent:** WIRED CHAOS META → 33.3FM DOGECHAIN → LYRIA ENGINE
**Brand identity layer:** NMX (NEURO META X), tagline `ALL MINDS VALID`

---

## ⟁ STACK & DEPLOY

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Components:** shadcn/ui (use existing primitives — don't fork them visually unless required)
- **Routing:** React Router (tabs are routes: `/studio`, `/rhythm`, `/score`, `/settings`)
- **State:** Zustand for in-app, `localStorage` for cross-app contract (see §5)
- **Backend:** Supabase (auth, edge functions for vault-mode API proxy, optional file storage for video uploads)
- **Music model:** Google Cloud Vertex AI — Lyria 3 (preview). Abstract behind a `lyriaService.ts` so the actual endpoint can be swapped.
- **Audio:** Web Audio API for playback + beatmap timing; `wavesurfer.js` for waveforms
- **Video (Score tab):** native `<video>` + FFmpeg.wasm for frame analysis if needed
- **Deploy target:** Vercel (Lovable default)

**Don't install:** Make.com integrations, jQuery, Bootstrap, MUI, Chakra. **Do install:** shadcn/ui primitives, `wavesurfer.js`, `zustand`, `lucide-react`.

---

## ⟁ VISUAL AESTHETIC (CYBER-NOIR — STRICT)

This must match the existing 33.3FM ecosystem. Treat it as a non-negotiable design system.

### Color tokens (Tailwind config, add to `tailwind.config.ts`)

```ts
colors: {
  cyan:   '#00ffe6',  // primary accent
  red:    '#ff1a2e',  // alerts, gates, RED FANG
  gold:   '#c2a633',  // $XENTS / DOGE / value
  base:   '#0052ff',  // BASE chain
  sol:    '#9945ff',  // SOL chain
  green:  '#00ff88',  // success / live status
  void:   '#000000',  // background
  ink:    '#0a0a0c',  // panel background
  hud:    'rgba(0,255,230,0.35)',  // panel borders
}
```

### Typography (load from Google Fonts in `index.html`)

- **Display / headers:** `Orbitron` (700/900 weight, .15–.35em letter-spacing)
- **Body / labels:** `Share Tech Mono`
- **Accent / model badge:** `Major Mono Display`
- **LED displays / numeric readouts:** `VT323`

### Visual primitives

1. **Scanlines overlay** — fixed full-screen `repeating-linear-gradient(0deg, rgba(0,255,230,.03) 0 1px, transparent 1px 3px)`, `mix-blend-mode: overlay`, `pointer-events: none`, z-50.
2. **CRT grain** — SVG turbulence noise filter, animated `steps(3)` 0.3s loop, opacity 0.05.
3. **HUD corner brackets** — 4 absolute `<span>` elements pinned to corners of any major panel, 28px L-shape, 1px cyan borders.
4. **Panels** — `border: 1px solid var(--hud); background: rgba(0,255,230,0.015);` with a label badge floating `top: -9px; left: 14px` over the border.
5. **Buttons** — gradient with `inset 0 2px 0 rgba(255,255,255,.25), inset 0 -3px 0 rgba(0,0,0,.4)` for tactile feel; press states drop `transform: translateY(2px)`.
6. **No emojis.** Use unicode glyphs: `◢ ◉ ◈ ◊ ◆ ▣ ▤ ⟁ ►◄ ❚❚`.

### Reference surfaces (already built — copy patterns from)

- `33-3fm-broadcast.html` — for the on-air vibe
- `33-3fm-studio.html` — for the production console layout
- `xents-change-machine.html` — for the retro arcade chassis feel (useful for the Rhythm tab)
- `33-3fm-mint.html` — for gate overlays + agent pipelines

**If Lovable doesn't have these in context, ask the user to paste them. They're the design source of truth.**

---

## ⟁ THE THREE TABS

Single SPA, persistent top nav, three primary tabs (+ Settings + History).

### Top navigation bar (always visible)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⟁ LYRIA ENGINE     STUDIO · RHYTHM · SCORE        ⟁ 5,000   ◉ SETT │
│   // WIRED CHAOS //                                $XENTS    INGS    │
└─────────────────────────────────────────────────────────────────────┘
```

Sticky, backdrop blur, scanline-friendly. The `⟁ 5,000` chip clicks to open the **$XENTS Change Machine widget** (see §6).

---

### TAB 1 // STUDIO

**Purpose:** Text-to-music. Type a narrative directive, Lyria generates a track.

**Layout:** Two-column desktop, stacks on mobile.
- **Left:** Directive input + parameter controls
- **Right:** Live generation status + waveform preview + mint draft card

**Components:**

1. **Directive editor** — large textarea, font `Share Tech Mono`, placeholder examples that cycle every 8s:
   - "Atmospheric cinematic track with heavy sub-bass, 92 BPM, F# minor, ghost vocals layered in the second verse"
   - "Aggressive phonk with industrial samples, distorted 808s, scanline percussion"
   - "Lo-fi hip hop for late-night driving, vinyl crackle, jazz piano sample, 85 BPM"

2. **Structure controls** (compact row above directive):
   - Length: 30s / 60s / 90s / 2min / 3min (chips)
   - Energy curve: Build / Plateau / Drop / Wave (visual mini-icons)
   - Vocals: None / Hummed / Lyrics (Lyria can do lyrics in some versions)

3. **HELP ME CREATE button** — calls Anthropic Claude (via existing `ANTHROPIC_API_KEY` in env, model `claude-sonnet-4-20250514`, max_tokens 500) to expand a vague prompt into a full Lyria directive. The user already has Claude API integration; reuse `/lib/anthropic.ts` pattern from existing apps.

4. **GENERATE button** — primary CTA, gold gradient. Disabled while generating. Shows cost in $XENTS (vault mode) or "BYOK · FREE" if user supplied own key.

5. **Generation status panel** (right column):
   - Animated progress (use Lyria's streaming response if available; fall back to indeterminate)
   - Estimated time remaining (Lyria preview is ~60-90s for 60s of audio)
   - Cancel button

6. **Result card** — appears when complete:
   - Wavesurfer.js waveform with cyan progress, gold played-portion
   - Play/pause + scrub + download (.wav)
   - **AUTO-GENERATED OAC DRAFT** banner (gold border) with track title, suggested ISRC, "REVIEW & MINT →" button that navigates to existing `33-3fm-mint.html` with the audio pre-loaded

7. **Recent generations** — sidebar list, last 10 outputs from `wc_lyria_history`, click to reload into player.

---

### TAB 2 // RHYTHM

**Purpose:** Beatmap rhythm game. DDR-style four-lane (←↓↑→) arrow chart synced to audio. Two modes per user's earlier decision:

- **LIVE BROADCAST MODE** — game plays whatever's currently on 33.3FM (reads `wc_radio_state` and streams the live audio). Beatmap auto-generated from the track's BPM + a kick-detection pass on the audio buffer.
- **GENERATE MODE** — generates a fresh Lyria track specifically for play. Cost: ⟁300 (cheaper than full Studio gen because it's a 60s loop).

**Layout:** Full-screen game canvas with HUD chrome.

**Components:**

1. **Mode toggle** — top of screen, two-button segmented control:
   ```
   [ ◢ LIVE BROADCAST ]  [ ⟁ GENERATE FRESH ]
   ```
   Live mode shows current on-air track info pulled from `wc_radio_state`.

2. **Game canvas** (center, ~800x600 desktop, full-screen mobile):
   - 4 vertical lanes, neon-bordered (cyan/gold/red/sol-purple — one color per lane)
   - Arrows scroll from top to bottom
   - Target line at bottom (~85% height) — when an arrow crosses, player taps the matching key
   - Hit zones: PERFECT (±50ms), GREAT (±100ms), GOOD (±150ms), MISS (>150ms)
   - Combo counter in upper-right, score in upper-left
   - Both rendered in Orbitron with gold glow

3. **Controls:**
   - Desktop: keys `D F J K` map to ←↓↑→ (D=left, F=down, J=up, K=right) — also accept arrow keys
   - Mobile: 4 large tap zones at bottom
   - Calibration option in settings (audio offset slider for high-latency Bluetooth)

4. **Beatmap generation:**
   - For **live mode**: pull track URL from `wc_radio_state.streamUrl`, decode with Web Audio, run a lightweight peak detection on the kick frequency band (40-80Hz). Place arrows on detected onsets, distribute across 4 lanes by mid/high frequency content (left lane = bass-heavy hits, right lane = hi-hat hits, etc.).
   - For **generate mode**: Lyria response includes a structure manifest (intros/verses/choruses with timing). Use that manifest directly — every drum hit in the manifest = an arrow. Cleaner than peak-detection.

5. **Score completion screen:**
   - Final score, accuracy %, max combo, longest streak
   - **$XENTS reward** — 50⟁ per perfect run (>95% accuracy), 25⟁ for >85%, 10⟁ for >70%. Credit via `XentsChange.bonus()`.
   - **MINT THIS RUN** button — top scores (>90%) become mintable proof-of-skill NFTs. Drafts to OAC with:
     - Title: `${trackTitle} // PERFORMED BY ${playerHandle}`
     - Description: includes accuracy + max combo
     - Attached metadata: full input log (timestamps of every key press)
     - Mint cost: standard ⟁5,000 (same as music release)
   - **PLAY AGAIN** + **LEADERBOARD** buttons

6. **Leaderboard** — accessible from main rhythm tab header. Pulls from Supabase table `lyria_rhythm_scores`. Filterable by track / by week / by player. Top 10 per track also surface as a sidebar on the game canvas.

---

### TAB 3 // SCORE VIDEO

**Purpose:** Upload a video, Lyria auto-scores it. Primary use case: **ATV Network** channel content soundtracking (the user's 32-channel OTT platform). Secondary: TikTok/Reels creators wanting custom music.

**Layout:** Upload zone (left) → analysis panel (center) → directive override + result (right).

**Components:**

1. **Upload zone** — drag-drop, accepts mp4/mov/webm up to 250MB. Cyan dashed border. On upload, validates duration (max 5min for v1) and extracts a thumbnail strip.

2. **Auto-analysis panel** (fires immediately after upload):
   - Frame extraction: 1 frame per 2 seconds, displayed as a horizontal strip
   - Mood detection: uses Gemini Vision (already in Lyria stack) to label each chunk — `tense / triumphant / melancholy / playful / cinematic / aggressive`
   - Pacing detection: cuts-per-minute → suggests BPM range
   - Color analysis: dominant palette → suggests musical key (warm = major, cool = minor)
   - All output displayed as auto-filled directive that the user can edit

3. **Directive override** — textarea pre-populated with the auto-analysis result. User can refine:
   ```
   "Tense cinematic build for 0:00–0:45, then triumphant drop at 0:45 sync to cut at 0:46. 
   Cool blue tones suggest D minor, pacing analysis suggests 110 BPM with half-time feel."
   ```
   The cuts/sync hints come from the visual analysis — let users see and edit them.

4. **Score parameters:**
   - Match cuts: ON/OFF (force-align musical events to detected cuts)
   - Style: Cinematic / Electronic / Acoustic / Hybrid / Match-Footage
   - Ducking: auto-duck under dialogue if speech is detected

5. **GENERATE SCORE** button — calls Lyria with the full directive + the cut-point manifest. Cost in vault mode: ⟁800 (more expensive than Studio because video analysis runs Gemini Vision first).

6. **Result panel:**
   - Preview player with video + new audio synced
   - A/B toggle: original audio vs Lyria score
   - Export options: MP4 muxed / WAV-only / Stems (if Lyria returns stems)
   - **SEND TO ATV** button — if the user is signed into ATV Network, push the scored video into their channel queue. Otherwise hidden.
   - **OAC DRAFT** card same as Studio tab — score becomes a mintable release (the music portion only, video stays separate).

---

## ⟁ API KEY VAULT (DUAL MODE)

Per user's choice: **both BYOK and managed vault.** Settings tab controls the mode.

### Mode 1: BYOK (Bring Your Own Key)

- User pastes their Google Cloud API key into a settings panel
- Stored in `localStorage` as `wc_lyria_byok_key`, **encrypted at rest** using SubtleCrypto with a passphrase the user provides
- Decryption happens client-side per session; the key never leaves the browser
- Generations are free (in $XENTS) — user pays Google directly via their key
- Show a "BYOK · FREE" badge on every generate button

### Mode 2: Vault (Managed)

- User pays $XENTS per generation:
  - Studio: ⟁500 per 60s of audio, scales linearly (so 2min = ⟁1000)
  - Rhythm GENERATE mode: ⟁300 (60s loop, smaller)
  - Score Video: ⟁800 + ⟁200 per minute of video
- Server-side Supabase edge function `/api/lyria-generate` holds the actual Google Cloud API key (set as Supabase secret `GOOGLE_CLOUD_API_KEY`)
- Flow:
  1. Client checks `XentsChange.balance() >= cost`; if not, opens Change Machine widget with `minBalance` set
  2. Client `XentsChange.spend({ amount, label, category: 'lyria-gen' })` — debits first
  3. Client POSTs to `/api/lyria-generate` with directive + structure + spend receipt
  4. Edge function verifies spend (reads same Supabase row) and forwards to Lyria
  5. Returns audio stream / URL to client
- Show "$XENTS · ⟁500" badge on the generate button

### Mode 3: AUTO (default for new users)

- Settings page has a single toggle: "API source: AUTO / BYOK / VAULT"
- AUTO uses BYOK if a valid key is saved, otherwise falls through to VAULT
- This is the default. Power users override.

### Settings panel UI

```
┌─ API KEY SOURCE ──────────────────────────┐
│  ◉ AUTO    ◯ BYOK    ◯ VAULT              │
│                                           │
│  BYOK KEY (encrypted at rest):            │
│  [ AIza...••••••••••••••••• ]  [TEST]    │
│  Passphrase: [ •••••••• ]                 │
│                                           │
│  ◢ TEST GENERATION                        │
│  [Last test: ✓ 2026-05-29 21:14]          │
│                                           │
│  VAULT PRICING:                           │
│  Studio (per 60s): ⟁500                   │
│  Rhythm gen:       ⟁300                   │
│  Score Video:      ⟁800 + ⟁200/min        │
└───────────────────────────────────────────┘
```

---

## ⟁ OAC AUTO-DRAFT INTEGRATION

Every successful Lyria generation auto-creates a draft in `wc_oac_drafts` (new key).

### Draft shape

```ts
type OACDraft = {
  id: string;                          // 'draft_' + nanoid
  source: 'lyria-studio' | 'lyria-rhythm' | 'lyria-score';
  trackTitle: string;                  // auto-suggested from directive, editable
  artist: string;                      // pulled from user profile, editable
  audioUrl: string;                    // blob URL or Supabase storage URL
  audioBlob?: Blob;                    // for not-yet-uploaded drafts
  durationSec: number;
  generatedFromDirective: string;      // the original prompt — useful for catalog
  bpm: number;
  key: string;
  mood: string;
  structure: any;                      // Lyria's intro/verse/chorus manifest
  cost: { xents: number, mode: 'byok' | 'vault' };
  createdAt: number;
  status: 'draft' | 'reviewed' | 'minted' | 'discarded';
};
```

### Flow

1. Lyria returns audio → client creates draft → writes to `wc_oac_drafts`
2. Notification toast: "⟁ OAC DRAFT CREATED — REVIEW & MINT"
3. Drafts list visible in a left sidebar (collapsed by default, badge shows count)
4. "REVIEW & MINT" button on the result card navigates to `33-3fm-mint.html?draftId=xxx`
5. The mint page reads the draft from `wc_oac_drafts`, pre-fills the form, attaches the audio blob
6. On mint confirm, draft `status` → `'minted'` and a record appears in `wc_oac_releases` (existing key — see `oac-agents.js`)

### Bulk actions (drafts sidebar)

- Select multiple → batch mint (one $XENTS spend per draft, but single confirmation)
- Discard (status → `'discarded'`, kept for 7 days then purged)
- Export as ZIP (download all audio + metadata json)

---

## ⟁ SHARED STATE CONTRACT (CROSS-APP)

LYRIA ENGINE is a separate Lovable app from the existing 33.3FM HTML stack, but they share `localStorage` on the same origin. **All cross-app communication is through these keys.**

| Key | Owner | LYRIA ENGINE access | Shape |
|-----|-------|---------------------|-------|
| `wc_radio_state` | broadcast | **read** (for Rhythm LIVE mode) | `{ onAir, currentDJ, track, streamUrl, ts }` |
| `wc_radio_tracks` | studio + mint | **write** (push minted Lyria tracks) | `[{ title, artist, source:'lyria', oacRelease:true, mintedAt, ... }]` |
| `wc_oac_drafts` | **lyria-engine** | **write** (new key) | see OACDraft shape above |
| `wc_oac_releases` | mint + oac-agents | read | existing — see `oac-agents.js` |
| `wc_xents_balance` | change-machine + widget | read (for gating, all charges go through widget) | integer |
| `wc_xents_ledger` | change-machine + widget | read | array, max 50 |
| `wc_lyria_history` | **lyria-engine** | **r/w** (new key) | last 50 generations, all 3 tabs |
| `wc_lyria_api_mode` | **lyria-engine** | **r/w** (new key) | `'auto' \| 'byok' \| 'vault'` |
| `wc_lyria_byok_key` | **lyria-engine** | **r/w** (new key, encrypted) | encrypted Google Cloud key + IV |
| `wc_lyria_rhythm_scores` | **lyria-engine** | **r/w** (new key, also Supabase) | local cache of leaderboard |

### Cross-tab events (Lyria writes these to BroadcastChannel `wired-chaos`)

```ts
type WCEvent =
  | { type: 'lyria.generated', source: 'studio'|'rhythm'|'score', draftId: string, durationSec: number }
  | { type: 'lyria.draft.created', draftId: string }
  | { type: 'lyria.draft.minted', draftId: string, releaseId: string }
  | { type: 'lyria.rhythm.scored', trackTitle: string, accuracy: number, xentsEarned: number }
  | { type: 'lyria.score.completed', videoFilename: string };
```

Subscribers (broadcast surface, studio, etc.) listen on the same channel for cross-surface UI updates.

---

## ⟁ $XENTS WIDGET INTEGRATION

**Don't rebuild the widget.** Load the existing one:

```html
<!-- in index.html -->
<script src="https://wiredchaos.xyz/333fm/xents-widget.js"></script>
```

Or, if Lovable can't load external scripts at boot, **port `xents-widget.js` into the project as `/public/xents-widget.js`** and load it from there. The widget's public API is unchanged:

```ts
window.XentsChange.open({ context, minBalance, reason, onSuccess });
window.XentsChange.spend({ amount, label, category, autoTopUp });
window.XentsChange.bonus({ amount, label });
window.XentsChange.balance();
window.XentsChange.onChange(callback);
```

Wrap it in a tiny TypeScript hook:

```ts
// src/hooks/useXents.ts
import { useEffect, useState } from 'react';
declare global { interface Window { XentsChange: any; } }

export function useXents() {
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    const tick = () => setBalance(window.XentsChange?.balance() ?? 0);
    tick();
    window.XentsChange?.onChange(setBalance);
    return () => window.XentsChange?.offChange?.(setBalance);
  }, []);
  return {
    balance,
    open: (opts: any) => window.XentsChange?.open(opts),
    spend: (opts: any) => window.XentsChange?.spend(opts),
    bonus: (opts: any) => window.XentsChange?.bonus(opts),
  };
}
```

The top-bar balance chip uses this hook.

---

## ⟁ LYRIA SERVICE LAYER

Abstract the Google Cloud call so it can be swapped later.

```ts
// src/services/lyriaService.ts

export type LyriaRequest = {
  directive: string;
  durationSec: number;
  structure?: 'build' | 'plateau' | 'drop' | 'wave';
  vocals?: 'none' | 'hummed' | 'lyrics';
  bpmHint?: number;
  keyHint?: string;
  apiMode: 'byok' | 'vault';
  byokKey?: string;
};

export type LyriaResponse = {
  audioUrl: string;
  durationSec: number;
  bpm: number;
  key: string;
  mood: string;
  structure: any;     // intro/verse/chorus manifest with timestamps
  cost?: { xents: number };
};

export async function generateMusic(req: LyriaRequest): Promise<LyriaResponse> {
  if (req.apiMode === 'byok') {
    return callLyriaDirect(req);
  }
  return callLyriaVault(req);
}

async function callLyriaDirect(req: LyriaRequest): Promise<LyriaResponse> {
  // Lyria 3 preview endpoint — replace with current Vertex AI URL
  // Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/music
  const endpoint = 'https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT/locations/us-central1/publishers/google/models/lyria-3:predict';
  // ... fetch, decode, return
}

async function callLyriaVault(req: LyriaRequest): Promise<LyriaResponse> {
  // Calls Supabase edge function which holds the real key
  const response = await fetch('/api/lyria-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return response.json();
}

export async function scoreVideo(videoBlob: Blob, directive: string, apiMode: 'byok'|'vault', byokKey?: string) {
  // Similar shape, but multipart form upload
}
```

**Important:** Lyria's actual API surface may change between Lovable build time and now. Include a `LYRIA_API_VERSION` constant and a fallback to Suno/Udio API if Lyria errors with `INSUFFICIENT_QUOTA` or `MODEL_UNAVAILABLE`. The fallback is optional but recommended for hackathon demos where Lyria might be region-locked.

---

## ⟁ SUPABASE SCHEMA

```sql
-- Vault-mode generation log
create table lyria_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  source text check (source in ('studio','rhythm','score')),
  directive text,
  duration_sec int,
  cost_xents int,
  audio_url text,
  bpm int,
  key text,
  mood text,
  structure jsonb,
  created_at timestamptz default now()
);

-- Rhythm game leaderboard
create table lyria_rhythm_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  player_handle text not null,
  track_title text not null,
  track_id text,  -- optional, links to wc_radio_tracks
  score int,
  accuracy real,  -- 0.0 to 1.0
  max_combo int,
  perfect_hits int,
  total_notes int,
  xents_earned int,
  minted_release_id text,  -- if user minted this run
  played_at timestamptz default now()
);

-- Score-video jobs
create table lyria_score_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  video_url text,
  duration_sec int,
  cost_xents int,
  directive text,
  result_audio_url text,
  result_video_url text,  -- muxed
  status text check (status in ('queued','analyzing','generating','complete','failed')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS — users see their own rows
alter table lyria_generations enable row level security;
create policy "own rows" on lyria_generations for all using (auth.uid() = user_id);
-- (repeat for the other tables)

-- Leaderboard is public-readable
alter table lyria_rhythm_scores enable row level security;
create policy "public read" on lyria_rhythm_scores for select using (true);
create policy "own insert" on lyria_rhythm_scores for insert with check (auth.uid() = user_id);
```

---

## ⟁ FILE STRUCTURE (TARGET)

```
lyria-engine/
├── public/
│   ├── xents-widget.js          ← ported from existing 333fm bundle
│   └── fonts/                   ← Orbitron, Share Tech Mono, etc. (Google Fonts CDN works too)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── Studio.tsx
│   │   ├── Rhythm.tsx
│   │   ├── Score.tsx
│   │   ├── Settings.tsx
│   │   └── History.tsx
│   ├── components/
│   │   ├── TopNav.tsx
│   │   ├── HudBrackets.tsx
│   │   ├── ScanlineOverlay.tsx
│   │   ├── Panel.tsx             ← reusable HUD panel wrapper
│   │   ├── XentsChip.tsx
│   │   ├── DirectiveEditor.tsx   ← used in Studio + Score
│   │   ├── WaveformPlayer.tsx
│   │   ├── DraftCard.tsx
│   │   ├── DraftsSidebar.tsx
│   │   ├── rhythm/
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── Lane.tsx
│   │   │   ├── ScoreBoard.tsx
│   │   │   ├── ResultScreen.tsx
│   │   │   └── Leaderboard.tsx
│   │   └── score/
│   │       ├── VideoUpload.tsx
│   │       ├── FrameStrip.tsx
│   │       └── AnalysisPanel.tsx
│   ├── hooks/
│   │   ├── useXents.ts
│   │   ├── useLyria.ts
│   │   ├── useDrafts.ts
│   │   └── useBroadcastChannel.ts
│   ├── services/
│   │   ├── lyriaService.ts
│   │   ├── beatmapService.ts     ← audio → beatmap generation
│   │   └── visionService.ts      ← Gemini Vision for Score tab
│   ├── lib/
│   │   ├── encryption.ts         ← SubtleCrypto wrappers for BYOK
│   │   ├── audio.ts              ← Web Audio helpers
│   │   └── nanoid.ts
│   ├── store/
│   │   └── useAppStore.ts        ← Zustand
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css             ← CSS variables for cyber-noir palette
│   └── types/
│       └── index.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_lyria_engine.sql
│   └── functions/
│       └── lyria-generate/
│           └── index.ts          ← vault-mode proxy
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## ⟁ BUILD ORDER (PHASE-BY-PHASE FOR LOVABLE)

Don't try to one-shot this. Build in phases and verify each works before moving on.

### Phase 1 — Skeleton (start here)
1. Vite + React + TypeScript + Tailwind boilerplate
2. Top nav with three tab routes + Settings + History
3. Visual system: scanlines, HUD brackets, panel wrapper, color tokens, fonts
4. $XENTS chip in top nav (load widget from `/public/xents-widget.js`)
5. **Verify:** all three tabs render empty shells with consistent chrome

### Phase 2 — Settings + API Key Vault
1. Settings page with API source toggle (Auto/BYOK/Vault)
2. BYOK encrypted storage (SubtleCrypto + passphrase)
3. Test-generation button that hits Lyria with a "test ping" 5s directive
4. **Verify:** BYOK round-trips correctly, encrypted at rest, test ping succeeds

### Phase 3 — Studio tab (the core)
1. Directive editor + structure controls
2. `lyriaService.ts` with BOTH modes wired
3. Generation status panel + Wavesurfer.js result player
4. Auto-OAC-draft on success
5. Drafts sidebar
6. History persistence
7. **Verify:** end-to-end generate → draft → mint handoff URL works

### Phase 4 — Supabase backend
1. Migrations (3 tables + RLS)
2. Edge function `lyria-generate`
3. Vault mode wired through edge function
4. **Verify:** vault mode debits $XENTS correctly, logs to `lyria_generations`

### Phase 5 — Rhythm tab
1. Game canvas (HTML canvas or pixijs)
2. Beatmap generator (`beatmapService.ts`)
3. Live broadcast mode (read `wc_radio_state`, stream audio)
4. Generate mode (calls Lyria for 60s loop)
5. Score screen + $XENTS reward via `XentsChange.bonus()`
6. Leaderboard (Supabase)
7. Mint top scores as proof-of-skill NFTs
8. **Verify:** full play loop, scores save to Supabase, leaderboard updates

### Phase 6 — Score Video tab
1. Video upload + frame extraction
2. Gemini Vision analysis → auto-directive
3. `scoreVideo()` service call
4. A/B preview player (original vs Lyria)
5. ATV Network push button (stub it if ATV API not ready)
6. OAC draft on completion
7. **Verify:** upload 30s test video, get a scored result back

### Phase 7 — Polish
1. Loading states, error boundaries, toast notifications
2. Empty states for every panel
3. Mobile responsive sweeps (Rhythm is the hardest)
4. PWA manifest (so it can be "installed" on mobile)
5. Analytics: BroadcastChannel events to GTM (`event: 'lyria_generated'`)
6. Onboarding flow for first-time users (3-step tour)

---

## ⟁ ACCEPTANCE CRITERIA

The build is done when:

- [ ] Top nav renders on all routes; $XENTS chip shows real balance; clicking it opens the existing Change Machine widget
- [ ] Settings page lets the user pick API mode and securely store a BYOK key
- [ ] Studio tab: type a directive, click GENERATE, get a real audio file back, hear it play, see the OAC draft card appear
- [ ] Rhythm tab LIVE mode: arrows scroll in time with the broadcast track; keyboard input registers hits; score increments
- [ ] Rhythm tab GENERATE mode: ⟁300 debits, fresh track generates, beatmap matches Lyria's structure manifest
- [ ] Score Video tab: upload a video, get auto-analysis, edit directive, generate, hear the new score under the video
- [ ] All three tabs create OAC drafts in `wc_oac_drafts` on success
- [ ] "REVIEW & MINT" button navigates to `33-3fm-mint.html?draftId=xxx` with audio pre-loaded
- [ ] Vault mode correctly debits $XENTS via widget; refuses + opens Change Machine if balance insufficient
- [ ] Leaderboard reads/writes to Supabase
- [ ] Cyber-noir aesthetic matches reference surfaces (no shadcn defaults bleeding through)
- [ ] Cross-app BroadcastChannel events fire correctly
- [ ] Mobile layout works on iPhone Safari + Android Chrome
- [ ] No console errors on first load
- [ ] Vercel deploy succeeds

---

## ⟁ JUDGE / HACKATHON ACCESS

The existing mint surface honors the bypass code `WC-MUSICATHON-2026` for ⟁10,000 eval credit. Add the same to Lyria Engine Settings:

```
◉ JUDGE / EVALUATOR ACCESS CODE
[ WC-MUSICATHON-2026 ]  [APPLY]
// CODE GRANTS ⟁10,000 EVAL CREDIT + UNLIMITED VAULT GENERATIONS FOR 24H //
```

When applied, set a flag `wc_lyria_judge_mode = true` with a 24-hour TTL. While true, vault-mode generations are free (still log to Supabase for analytics, but skip the $XENTS debit). Show a small "JUDGE MODE" badge in the top nav.

---

## ⟁ NOTES FOR LOVABLE / NEURO

1. **Lyria preview availability:** Lyria 3 is in Google Cloud preview as of this writing (May 2026). If your Google Cloud project doesn't have access, the BYOK path will 403 — apply for access at https://cloud.google.com/vertex-ai/generative-ai/docs/music or have your vault mode fall back to Suno/Udio APIs. Don't ship with Lyria-only and break your demo.

2. **Region-lock:** Lyria endpoints are currently us-central1 only. Set `LYRIA_REGION = 'us-central1'` and route requests accordingly.

3. **Audio file format:** Lyria returns audio as base64-encoded PCM or WAV. Decode and re-encode to MP3 client-side via `lamejs` if you want smaller blob sizes for the draft pipeline.

4. **Latency expectations:** Studio gen is ~60-90s for a 60s track. Rhythm gen is ~30s (smaller). Score video is the heaviest (~2-3min) because of frame analysis. Show realistic progress indicators.

5. **Cost reality check:** Lyria pricing is roughly $0.10–0.30 per minute generated (Google Cloud bills you). Your vault price of ⟁500 = $5 per 60s creates a healthy margin. Don't underprice.

6. **Existing 333fm files to attach to Lovable as context:**
   - `33-3fm-broadcast.html`
   - `33-3fm-mint.html`
   - `xents-widget.js`
   - `oac-agents.js`
   - `33-3FM-DOGECHAIN-MASTER-PROMPT.md`

   Drop these in Lovable's project files so it can reference the design language and the existing localStorage contract.

7. **What NOT to build in v1:**
   - Multi-user real-time rhythm battles (save for v2)
   - On-chain mint inside Lyria Engine (let the existing mint.html do that work)
   - Custom audio synthesis beyond Lyria (no Tone.js compositions; you already have Lyria)
   - Spotify embed for previews (DDEX handles that on the OAC side)
   - Stem separation (Lyria may return stems natively in a future version; don't try to do it yourself)

---

## ⟁ FINAL ECOSYSTEM PICTURE

```
                                    ┌─────────────────────┐
                                    │  $XENTS CHANGE      │
                                    │  MACHINE (widget)   │
                                    │  ⟁ 1:1 ONE-WAY     │
                                    └──────────┬──────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
                  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
                  │ LYRIA ENGINE  │   │ 33.3FM        │   │ ATV NETWORK   │
                  │ (this app)    │   │ BROADCAST     │   │ (video twin)  │
                  ├───────────────┤   ├───────────────┤   ├───────────────┤
                  │ ◢ STUDIO      │   │ DJ RED FANG   │   │ 32 channels   │
                  │ ⟁ RHYTHM      │──▶│ PACK · LENS   │   │ scored by     │
                  │ ◊ SCORE VIDEO │   │ MINT · ORACLE │   │ Lyria Engine  │
                  └───────┬───────┘   │ NEXUS         │   └───────────────┘
                          │           └───────────────┘
                          ▼
                  ┌───────────────┐
                  │ OAC PIPELINE  │
                  │ 8 AGENTS      │
                  │ RELEASE→...→  │
                  │ INSIGHTS      │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ MINT          │
                  │ ⟁ 5,000      │
                  │ Multi-chain + │
                  │ DDEX parallel │
                  └───────────────┘

  ALL MINDS VALID · 33⅓ ETERNAL · SIGNAL LOCKED
```

This is the full creator vertical. Generate music, perform it, score video with it, distribute it. Lyria Engine is the missing top-of-funnel that turns the existing 33.3FM + OAC stack from a *broadcast* platform into a *creation* platform.

---

`// END MASTER PROMPT //`
`// PASTE INTO LOVABLE · BUILD PHASE-BY-PHASE //`
`// QUESTIONS? RETURN TO CLAUDE BEFORE COMMITTING ARCHITECTURE CHANGES //`
