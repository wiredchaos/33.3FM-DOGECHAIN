# LYRIA ENGINE × MRT2 — INTEGRATION PATCH

> **Apply on top of LYRIA-ENGINE-MASTER-PROMPT.md.** This patch upgrades the Lyria Engine Lovable app from a single-provider tool (Google Lyria API) into a **three-tier model selector** with MRT2 as the recommended option for compatible hardware. Adds local-first generation, hardware detection, and a "BYO Local" upload flow that bridges desktop generation to the OAC mint pipeline.

---

## ⟁ ARCHITECTURE CHANGE: ONE MODEL → THREE TIERS

### Before (v1)

```
User → Lyria Engine UI → Google Lyria API (paid, region-locked, preview)
                          OR
                       → Suno/Udio fallback (if Lyria unavailable)
```

### After (v2 with MRT2)

```
User → Lyria Engine UI → Hardware Detection
                          ├─ Apple Silicon Mac → MRT2 LOCAL (free, 2GB DL)
                          ├─ Linux GPU (40GB+) → MRT2 SELF-HOSTED (free, advanced)
                          ├─ Any browser      → MRT2 CLOUD ($XENTS, server-side)
                          └─ Fallback         → Google Lyria API (BYOK or vault)
                                              → Suno/Udio (last resort)
```

The default tier shown is dynamically chosen based on what the user has. The user can always override.

---

## ⟁ NEW UI: MODEL SELECTOR PANEL

Add a model selector at the top of the Lyria Engine app, persisted in `localStorage` as `wc_lyria_model_choice`.

### Visual spec (cyber-noir, matches WIRED CHAOS aesthetic)

```
┌────────────────────────────────────────────────────────────┐
│ ◢ GENERATION MODEL                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ ⟁ MRT2   │  │ ⟁ MRT2   │  │ ⟁ LYRIA  │  │ ⟁ SUNO   │  │
│  │  LOCAL   │  │  CLOUD   │  │   API    │  │ FALLBACK │  │
│  │          │  │          │  │          │  │          │  │
│  │ FREE     │  │ ⟁ 50/gen │  │ BYOK or  │  │ ⟁150/gen │  │
│  │ Real-    │  │ Real-    │  │ vault    │  │ Cloud    │  │
│  │ time     │  │ time     │  │ ⟁500/min │  │ batch    │  │
│  │          │  │          │  │          │  │          │  │
│  │ M-chip   │  │ Browser  │  │ Browser  │  │ Browser  │  │
│  │ Mac only │  │ anywhere │  │ anywhere │  │ anywhere │  │
│  │ [DETECT] │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                            │
│  Selected: MRT2 LOCAL ✓                                    │
│  ◢ STATUS: Model not yet installed                         │
│  [ DOWNLOAD MAGENTA RT (2.5GB) → ]                         │
└────────────────────────────────────────────────────────────┘
```

### React component skeleton

```tsx
// src/components/ModelSelector.tsx
import { useEffect, useState } from "react";
import { detectHardware } from "@/lib/hardwareDetect";
import { useLyriaStore } from "@/store/lyria";

const MODELS = [
  {
    id: "mrt2-local",
    name: "MRT2 LOCAL",
    cost: "FREE",
    speed: "Real-time",
    requires: "Apple Silicon Mac",
    description: "Generate locally on your machine. No API costs, no quota, no internet required. Outputs are yours, no rights claimed by Google.",
    badge: "RECOMMENDED",
  },
  {
    id: "mrt2-cloud",
    name: "MRT2 CLOUD",
    cost: "⟁ 50 / generation",
    speed: "Real-time",
    requires: "Any browser",
    description: "Run MRT2 on our GPU servers. Pay-per-generation in $XENTS. Same model, no install.",
  },
  {
    id: "lyria-api",
    name: "LYRIA API",
    cost: "BYOK free · Vault ⟁500/min",
    speed: "Batch (~30s)",
    requires: "Google API key (BYOK) or Vault mode",
    description: "Google's hosted Lyria. Higher fidelity for long-form pieces. Region-locked outside US.",
  },
  {
    id: "suno-fallback",
    name: "SUNO FALLBACK",
    cost: "⟁ 150 / generation",
    speed: "Batch (~45s)",
    requires: "Any browser",
    description: "Last-resort fallback for when other models fail. Most expensive but highest reliability.",
  },
];

export function ModelSelector() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const { model, setModel } = useLyriaStore();

  useEffect(() => {
    detectHardware().then(setHardware);
  }, []);

  const isAvailable = (modelId: string) => {
    if (modelId === "mrt2-local") return hardware?.isAppleSilicon;
    return true;
  };

  return (
    <div className="border border-cyan-500/30 p-6 bg-black">
      <h2 className="font-orbitron text-cyan-400 mb-4 tracking-widest text-sm">
        ◢ GENERATION MODEL
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {MODELS.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            available={isAvailable(m.id)}
            selected={model === m.id}
            onClick={() => isAvailable(m.id) && setModel(m.id)}
          />
        ))}
      </div>
      <ModelStatus modelId={model} hardware={hardware} />
    </div>
  );
}
```

---

## ⟁ HARDWARE DETECTION

`src/lib/hardwareDetect.ts`:

```ts
export type HardwareInfo = {
  isAppleSilicon: boolean;
  isMac: boolean;
  isLinuxGpu: boolean; // best-effort; user must self-report
  cpuCores: number;
  memoryGb: number; // approximate, via deviceMemory API
  gpu: string; // best-effort via WebGL renderer string
};

export async function detectHardware(): Promise<HardwareInfo> {
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  // Mac detection
  const isMac = /Mac/i.test(platform) || /Mac/i.test(ua);

  // Apple Silicon detection — best-effort
  // Modern browsers report "MacIntel" for both Intel and ARM Macs
  // We use canvas-based GPU detection
  let isAppleSilicon = false;
  if (isMac) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
        isAppleSilicon = /Apple/i.test(String(renderer));
      }
    } catch {}
  }

  const cpuCores = navigator.hardwareConcurrency || 4;
  // @ts-ignore — deviceMemory not in all type defs
  const memoryGb = navigator.deviceMemory || 8;

  let gpu = "unknown";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
    }
  } catch {}

  return {
    isAppleSilicon,
    isMac,
    isLinuxGpu: /Linux/i.test(platform) && /NVIDIA|AMD/i.test(gpu),
    cpuCores,
    memoryGb,
    gpu,
  };
}
```

**Note on accuracy:** browser hardware detection is fundamentally approximate. The user can override at any time. The detection is for *defaulting the recommendation*, not for gating.

---

## ⟁ THREE FLOWS, ONE PIPELINE

Each model has a different runtime, but they all converge on the same OAC mint pipeline once audio exists.

### Flow A: MRT2 LOCAL (Apple Silicon)

1. User selects MRT2 LOCAL → sees install prompt
2. Click "Download Magenta RT" → opens `https://storage.googleapis.com/magenta-rt-public/magenta-rt-2/downloads/MRT2%20Bundle.zip`
3. User extracts and runs the standalone app (Jam, Collider, or MRT2 standalone) outside the browser
4. User generates locally, exports WAV
5. Return to Lyria Engine → "I generated locally — upload my WAV" button
6. User drags WAV in → metadata extraction → OAC mint flow

The Lyria Engine here functions as a **launcher + uploader**, not a generator. This is fine — local-first means the heavy lifting happens outside the browser.

### Flow B: MRT2 CLOUD (any browser)

1. User selects MRT2 CLOUD → sees prompt UI
2. User enters text prompt + (optional) audio reference + duration
3. Lyria Engine POSTs to `/api/mrt2/generate` (Supabase edge function)
4. Edge function debits $XENTS via `debit_xents` RPC
5. Edge function calls MRT2 GPU server (your own infra — see deployment section below)
6. GPU server streams audio chunks back via WebSocket (real-time playback) OR returns final WAV (batch mode)
7. User reviews, accepts → OAC mint flow

### Flow C: LYRIA API (BYOK or vault)

Unchanged from v1 spec. Uses `models.generateMusic` against Google's hosted Lyria API.

### Flow D: SUNO FALLBACK (any browser)

Unchanged from v1 spec. Uses Suno's API as last resort.

---

## ⟁ MRT2 CLOUD GPU INFRASTRUCTURE (FLOW B)

The cloud option requires you to run MRT2 server-side. Options ranked by cost/complexity:

### Option 1: Modal Labs (recommended for v1)

Modal lets you deploy GPU-backed Python functions with auto-scale. You pay only for GPU-seconds used. MRT2 needs an A100 or H100.

```python
# modal_mrt2.py
import modal

app = modal.App("wc-mrt2-server")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .pip_install("magenta-rt[gpu]==0.1.0", "tf2jax==0.3.8")
)

@app.function(
    image=image,
    gpu="A100-80GB",
    timeout=300,
    secrets=[modal.Secret.from_name("supabase-creds")],
)
def generate(prompt: str, duration_sec: int = 30, audio_ref: bytes | None = None) -> bytes:
    from magenta_rt import audio, system

    mrt = system.MagentaRT()
    style = system.embed_style(prompt) if not audio_ref else system.embed_audio_style(audio_ref)

    chunks = []
    state = None
    chunks_needed = round(duration_sec / mrt.config.chunk_length)
    for _ in range(chunks_needed):
        state, chunk = mrt.generate_chunk(state=state, style=style)
        chunks.append(chunk)

    generated = audio.concatenate(chunks)
    return generated.to_mp3_bytes()
```

Estimated cost: A100-80GB on Modal is ~$3/hour. A 30s MRT2 generation takes ~5 seconds. **Cost per generation: ~$0.004.** You charge ⟁50 = $0.50, margin ~125x. Sustainable.

### Option 2: RunPod / Lambda Labs (self-managed)

Spin up a persistent A100 instance, run MRT2 as a long-lived service. Cheaper if utilization is high (>30%), more expensive if it sits idle.

### Option 3: Replicate / Banana (managed inference)

Wrap MRT2 in a Replicate cog, charge per second of GPU time. Simpler ops, slightly higher unit cost.

**Recommendation:** start with Modal. Scale to RunPod when you have a steady >100 generations/day.

---

## ⟁ STATE & PERSISTENCE UPDATES

Add to the Lyria Engine Zustand store:

```ts
// src/store/lyria.ts (additions)
interface LyriaState {
  // existing fields...

  // NEW: Model selection
  model: "mrt2-local" | "mrt2-cloud" | "lyria-api" | "suno-fallback";
  setModel: (m: string) => void;

  // NEW: Hardware info (cached)
  hardware: HardwareInfo | null;
  setHardware: (h: HardwareInfo) => void;

  // NEW: MRT2 local install state
  mrt2LocalDetected: boolean; // user has confirmed install
  setMrt2LocalDetected: (b: boolean) => void;

  // NEW: Local WAV upload queue
  localUploads: LocalUpload[];
  addLocalUpload: (u: LocalUpload) => void;
}

type LocalUpload = {
  id: string;
  file: File;
  prompt: string; // user-provided description for OAC metadata
  bpm?: number;
  key?: string;
  uploadedAt: number;
  status: "queued" | "processing" | "minted" | "failed";
};
```

LocalStorage keys:
- `wc_lyria_model_choice` — selected model
- `wc_lyria_hardware` — last detected hardware (cached 24h)
- `wc_lyria_mrt2_installed` — boolean, set when user confirms install
- `wc_lyria_local_uploads` — queue of WAVs awaiting OAC mint

---

## ⟁ OAC HANDOFF (UNCHANGED)

Once audio exists (regardless of source), it enters the OAC pipeline as before. The only new step is the **provenance tag**:

```js
// In OAC release creation, add:
const release = {
  // ...existing fields
  meta: {
    // ...existing metadata
    source: "mrt2-local" | "mrt2-cloud" | "lyria-api" | "suno-fallback",
    attribution: source.startsWith("mrt2")
      ? "Powered by Magenta RealTime 2 by Google DeepMind, used under CC-BY 4.0"
      : null,
  },
};
```

The OAC `Compliance` agent reads `meta.attribution` and:
- If present, ensures C2PA manifest embeds the attribution
- Adds attribution to ID3 `TCOM` or `TXXX:attribution` tag
- Surfaces in artist page metadata
- Logs to a public `attributions.json` at `wiredchaos.xyz/attributions.json`

---

## ⟁ NEW UI: "I HAVE LOCAL OUTPUT" UPLOAD FLOW

For MRT2 LOCAL users who have generated outside the browser, add a streamlined upload flow at the bottom of the Studio tab:

```
┌─────────────────────────────────────────────────────┐
│ ◢ GENERATED LOCALLY?                                │
│                                                     │
│ Drop your MRT2-generated WAV here to mint via OAC.  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │            [ DROP WAV HERE ]                    │ │
│ │            or click to browse                   │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ◢ AUTO-METADATA EXTRACTION                          │
│   ✓ Duration: from file                             │
│   ✓ BPM: librosa beat detection                     │
│   ✓ Key: chroma analysis                            │
│   ⚠ Title / mood: please describe below             │
│                                                     │
│ Title:  [____________________]                      │
│ Mood:   [____________________]                      │
│ Source: MRT2 LOCAL ✓ (attribution auto-added)       │
│                                                     │
│ [ DRAFT TO OAC → ]                                  │
└─────────────────────────────────────────────────────┘
```

Component:

```tsx
// src/components/LocalUploadDropzone.tsx
export function LocalUploadDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ title: "", mood: "", bpm: 0, key: "" });

  const handleDrop = async (file: File) => {
    setFile(file);
    // Extract metadata client-side
    const audioBuffer = await fileToAudioBuffer(file);
    const bpm = await detectBPM(audioBuffer); // simple onset detection
    const key = await detectKey(audioBuffer); // chroma + Krumhansl
    setMeta({ ...meta, bpm, key });
  };

  const handleSubmit = async () => {
    if (!file || !meta.title) return;
    // Create OAC draft via existing OAC API
    const draft = {
      trackTitle: meta.title,
      mood: meta.mood,
      audioFile: file,
      meta: {
        durationSec: file.duration,
        bpm: meta.bpm,
        key: meta.key,
        source: "mrt2-local",
        attribution: "Powered by Magenta RealTime 2 by Google DeepMind, used under CC-BY 4.0",
      },
    };
    await createOacDraft(draft);
    // route to OAC pipeline view
  };

  return ( /* dropzone JSX */ );
}
```

---

## ⟁ ATTRIBUTION FOOTER (REQUIRED)

When the active model is MRT2 (local or cloud), the Lyria Engine UI must display attribution. Suggested implementation:

```tsx
// src/components/LyriaFooter.tsx
import { useLyriaStore } from "@/store/lyria";

export function LyriaFooter() {
  const model = useLyriaStore((s) => s.model);
  const isMrt2 = model.startsWith("mrt2");

  return (
    <footer className="border-t border-cyan-500/20 mt-12 py-6 text-center text-xs tracking-widest text-cyan-500/40">
      <div>// LYRIA ENGINE · WIRED CHAOS · ALL MINDS VALID //</div>
      {isMrt2 && (
        <div className="mt-2 text-gold-500/60">
          ◢ Powered by{" "}
          <a
            href="https://magenta.withgoogle.com/mrt2"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold-400"
          >
            Magenta RealTime 2
          </a>{" "}
          by Google DeepMind, used under CC-BY 4.0
        </div>
      )}
    </footer>
  );
}
```

This satisfies the CC-BY attribution requirement with minimal UI noise.

---

## ⟁ UPDATED ACCEPTANCE CHECKLIST (v2 ADDITIONS)

In addition to v1 acceptance criteria, the v2 release must:

- [ ] Hardware detection runs on app load and caches result in `wc_lyria_hardware`
- [ ] Model selector defaults to MRT2 LOCAL on Apple Silicon, MRT2 CLOUD elsewhere
- [ ] User can override the default and pick any tier manually
- [ ] MRT2 LOCAL shows install state (not installed / downloading / ready)
- [ ] MRT2 LOCAL provides one-click link to the official Magenta download
- [ ] MRT2 CLOUD wires to Supabase edge function that proxies to Modal/RunPod MRT2 server
- [ ] MRT2 CLOUD debits $XENTS atomically before generation starts (refund on server error)
- [ ] Local upload dropzone accepts WAV/MP3/FLAC and extracts BPM/key/duration client-side
- [ ] All MRT2 generations write `source: "mrt2-{local|cloud}"` to release metadata
- [ ] OAC Compliance agent embeds CC-BY attribution in C2PA manifest for MRT2 sources
- [ ] LyriaFooter renders attribution when active model is MRT2
- [ ] `attributions.json` endpoint is published at `wiredchaos.xyz/attributions.json` with full credit list

---

## ⟁ MIGRATION FROM V1

Existing users of Lyria Engine v1 should be migrated smoothly:

1. On first load of v2, detect hardware
2. If user previously selected `lyria-api` (BYOK or vault), preserve that selection
3. If user never selected anything (default v1 behavior), recommend MRT2 LOCAL or CLOUD based on hardware
4. Show a one-time onboarding modal: *"NEW: MRT2 is now available — generate locally for free on Apple Silicon, or use our GPU servers for ⟁50/generation. Your existing Lyria API setup is still active."*

The modal is dismissable, persisted to `wc_lyria_v2_onboarded`.

---

## ⟁ TIMELINE

- **Day 1:** Hardware detection + Model Selector UI
- **Day 2:** MRT2 LOCAL install flow + local upload dropzone
- **Day 3:** Modal Labs MRT2 GPU server deployment + Supabase edge function
- **Day 4:** MRT2 CLOUD wired end-to-end with $XENTS billing
- **Day 5:** Attribution footer + C2PA integration + attributions.json
- **Day 6:** Migration UX + onboarding modal
- **Day 7:** QA + launch

**One focused week with a developer (or with Claude Code).**

`// END PATCH //`
`// LYRIA ENGINE v2 · THREE-TIER MODEL SELECTOR //`
`// MRT2 IS THE NEW DEFAULT FOR APPLE SILICON USERS //`
