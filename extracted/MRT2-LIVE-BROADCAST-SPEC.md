# 33.3FM × MRT2 LIVE BROADCAST — INTEGRATION RUNBOOK

> **Goal:** Replace pre-recorded agent DJ playlists during specific broadcast slots with **live MRT2 generation**, streamed directly to Icecast as if a human DJ were jamming live. RED FANG's CIPHER HOUR (02:00) becomes a never-repeated, never-rebroadcast live MRT2 set. Every airing is a unique performance.

> **Why this matters:** It moves 33.3FM from "automated playlist" to "live agent radio." FatMemes Music has a "Live Room" with no live content. Spotify has nothing like this. Even Audius has nothing like this. **This is a feature no incumbent can ship — they don't own their audio infrastructure or their generative models.** You do.

---

## ⟁ ARCHITECTURE

```
┌──────────────────────┐
│ MRT2 GPU Server      │
│ (Modal / RunPod /    │
│  self-hosted A100)   │
│                      │
│ Runs continuously    │
│ during scheduled     │
│ live slots           │
└──────────┬───────────┘
           │ generates 2s chunks @ 48kHz stereo
           │ MP3-encoded over WebSocket or RTP
           ▼
┌──────────────────────┐
│ mrt2-to-icecast      │
│ bridge (Python)      │
│                      │
│ - Receives chunks    │
│ - Crossfades         │
│ - Embeds metadata    │
│ - Pushes to harbor   │
└──────────┬───────────┘
           │ Icecast SOURCE protocol over HTTPS
           ▼
┌──────────────────────┐
│ Liquidsoap           │
│ input.harbor("live") │
│ (already configured  │
│ in your stack)       │
└──────────┬───────────┘
           │ falls through to main_audio fallback
           │ during scheduled live slots
           ▼
┌──────────────────────┐
│ Icecast2             │
│ /stream.mp3          │
└──────────┬───────────┘
           │
           ▼
       Listeners
```

The key insight: **Liquidsoap already has `input.harbor("live", ...)` configured** from the broadcast setup runbook. That input accepts Icecast SOURCE protocol from any client — Mixxx, butt, or in this case, an MRT2-to-Icecast bridge. The bridge makes MRT2 look like just another DJ connecting to the harbor port.

---

## ⟁ THE LIVE BROADCAST SCHEDULE

Pick the slots where live MRT2 makes most sense. Not every slot benefits — some agent DJs (MINT's MIDDAY DRIFT) are background listening where novelty matters less. Others (RED FANG's CIPHER HOUR) are where listeners actively tune in for the *experience*. Start with high-attention slots:

| Slot | Agent | Style | Mode | Why live |
|---|---|---|---|---|
| 02:00-04:00 | RED FANG | Phonk/industrial | **LIVE MRT2** | CIPHER HOUR is the brand-defining slot. Live = mythology. |
| 04:00-06:00 | ORACLE | Drone/ambient | **LIVE MRT2** | Drone benefits from never repeating. 2 hours of unique generative ambient. |
| 20:00-22:00 | NEXUS | Hyperpop/glitch | **LIVE MRT2** | Primetime + chaotic genre = best showcase. |
| 07:00-09:00 | LENS | Synthwave | Playlist | Commute = consistency matters more than novelty. |
| 12:00-14:00 | MINT | Lo-fi | Playlist | Lunchtime = predictability. |
| 18:00-20:00 | PACK | Drill | Playlist | Evening drive = curated favorites. |

Three slots live, three playlist — gives you 8 hours/day of live MRT2 broadcast. **8 × 365 = ~2,920 GPU-hours per year per slot.**

---

## ⟁ COST ANALYSIS

### MRT2 base model GPU requirements

Per the Magenta GitHub README, MRT2 generates ~2 seconds of audio per ~1 second of A100 GPU time. So for **continuous live broadcast**, you need an A100 running continuously during live slots.

### Cost per hour of live broadcast

| Compute provider | A100-80GB hourly | Daily (6h live) | Monthly |
|---|---|---|---|
| Modal (per-second billing) | $3.00 | $18 | $540 |
| RunPod (community cloud) | $1.89 | $11.34 | $340 |
| Lambda Labs (reserved) | $1.29 | $7.74 | $232 |
| Self-hosted A100 (Hetzner GPU) | ~$1.00 | $6 | $180 |

**Monthly recommendation:** start on **RunPod community cloud** at ~$340/month for 6 hours/day of live broadcast across three slots. As volume increases, migrate to reserved instances.

### Revenue offset

If each live broadcast has even 20 average concurrent listeners and 1% tip during the show at ⟁100 each:
- 20 listeners × 6 hours × 30 days = 3,600 listener-hours/month
- 1% tip rate → 36 tips × $1 = $36/month per active listener-hour rate

You need ~10x higher engagement to break even on the live compute. Live broadcast is a **brand-building investment**, not a profit center on its own.

**However:** live broadcast drives Agent DJ Instrument sales. If one Tier 2 instrument ($250) sells per month because of the live experience, broadcast pays for itself. If two sell, it's profitable. This is the actual ROI path.

---

## ⟁ THE MRT2-TO-ICECAST BRIDGE

The bridge is a Python service that runs alongside MRT2 and pushes audio chunks to Liquidsoap's harbor input. Save as `mrt2_bridge.py`:

```python
#!/usr/bin/env python3
"""
MRT2-to-Icecast Bridge
Runs live MRT2 generation and streams output as Icecast SOURCE.
"""

import argparse
import io
import os
import sys
import time
import threading
import queue
from typing import Optional

import numpy as np
import requests
from pydub import AudioSegment
from magenta_rt import audio, system


# ============================================================
# CONFIGURATION
# ============================================================

AGENT_PROFILES = {
    "red-fang": {
        # CANON: BRAND-BIBLE-RED-FANG.md
        # Cyber-Soul / Afrofuturist Downtempo / Dark R&B
        # Flagship persona — Voice of 33.3 FM
        "style_prompts": [
            "cyber-soul 92bpm F sharp minor sultry Rhodes piano vinyl crackle breathing sub-bass live electric bass slow-burn",
            "Afrofuturist downtempo 88bpm D minor velvet Wurlitzer muted trumpet J Dilla drums tape saturation midnight",
            "dark R&B trip-hop 95bpm A minor reverb vocal samples Mellotron strings predator crimson transmission",
        ],
        "prompt_change_interval_sec": 180,  # rotate every 3 min for variation
        "musiccoca_weights": [0.5, 0.3, 0.2],  # primary, secondary, tertiary
        "reference_touchstones": [
            # For documentation; not sent to the model. Used to guide training corpus selection.
            "Erykah Badu", "FKA twigs", "Massive Attack", "Sade",
            "Solange", "Kelela", "Yves Tumor", "Portishead", "Sevdaliza",
        ],
    },
    "oracle": {
        "style_prompts": [
            "drone ambient 60bpm A minor meditative pre-dawn entropy",
            "dark ambient drone 55bpm E minor granular evolving",
            "generative ambient bell tones 50bpm sub-bass long pads",
        ],
        "prompt_change_interval_sec": 300,
        "musiccoca_weights": [0.5, 0.3, 0.2],
    },
    "nexus": {
        "style_prompts": [
            "hyperpop glitch 158bpm F sharp minor pitched vocals chaotic",
            "future bass cyberpunk 162bpm B minor sidechain drops",
            "glitch hyperpop 155bpm D minor 8-bit references catchy",
        ],
        "prompt_change_interval_sec": 120,
        "musiccoca_weights": [0.6, 0.3, 0.1],
    },
}

ICECAST_HARBOR_HOST = "stream.wiredchaos.xyz"
ICECAST_HARBOR_PORT = 8005
ICECAST_HARBOR_PASSWORD = os.environ["ICECAST_LIVE_PASSWORD"]
ICECAST_MOUNT = "/live"


# ============================================================
# MRT2 LIVE GENERATOR
# ============================================================

class MRT2LiveGenerator:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.profile = AGENT_PROFILES[agent_id]
        self.mrt = system.MagentaRT()
        self.state = None
        self.current_prompt_index = 0
        self.last_prompt_change = time.time()

    def get_current_style(self):
        """Rotate through prompts on a timer for variation."""
        now = time.time()
        if now - self.last_prompt_change > self.profile["prompt_change_interval_sec"]:
            self.current_prompt_index = (self.current_prompt_index + 1) % len(self.profile["style_prompts"])
            self.last_prompt_change = now
            print(f"[{self.agent_id}] Style change → prompt #{self.current_prompt_index}")

        prompt = self.profile["style_prompts"][self.current_prompt_index]
        return system.embed_style(prompt)

    def generate_chunk(self) -> np.ndarray:
        """Generate next 2-second audio chunk."""
        style = self.get_current_style()
        self.state, chunk = self.mrt.generate_chunk(state=self.state, style=style)
        return chunk.samples  # (samples, 2) float32 in -1..1


# ============================================================
# ICECAST SOURCE PUSHER
# ============================================================

class IcecastSourcePusher:
    def __init__(self, host, port, mount, password, agent_id):
        self.host = host
        self.port = port
        self.mount = mount
        self.password = password
        self.agent_id = agent_id
        self.session = requests.Session()
        self.bitrate_kbps = 128
        self.sample_rate = 48000

    def push(self, audio_queue: queue.Queue):
        """Connect to Icecast and stream MP3 chunks indefinitely."""
        url = f"http://{self.host}:{self.port}{self.mount}"
        headers = {
            "Authorization": f"Basic {self._auth_b64()}",
            "Content-Type": "audio/mpeg",
            "ice-name": f"33.3FM // LIVE · {self.agent_id.upper()}",
            "ice-description": "Live MRT2 jam session — never broadcast again",
            "ice-genre": "AI-generated live",
            "ice-bitrate": str(self.bitrate_kbps),
            "ice-public": "1",
        }

        def gen():
            while True:
                samples = audio_queue.get()
                if samples is None:
                    break
                # Convert float32 -1..1 → int16 PCM → MP3
                pcm = (samples * 32767).clip(-32768, 32767).astype(np.int16)
                segment = AudioSegment(
                    pcm.tobytes(),
                    frame_rate=self.sample_rate,
                    sample_width=2,
                    channels=2,
                )
                buf = io.BytesIO()
                segment.export(buf, format="mp3", bitrate=f"{self.bitrate_kbps}k")
                yield buf.getvalue()

        print(f"[{self.agent_id}] Connecting to Icecast at {url}...")
        response = self.session.put(url, headers=headers, data=gen(), stream=True)
        print(f"[{self.agent_id}] Icecast response: {response.status_code}")

    def _auth_b64(self):
        import base64
        return base64.b64encode(f"source:{self.password}".encode()).decode()


# ============================================================
# METADATA UPDATER
# ============================================================

class MetadataUpdater:
    def __init__(self, host, port, mount, admin_password):
        self.host = host
        self.port = port
        self.mount = mount
        self.password = admin_password

    def update(self, title: str, artist: str):
        """Push a new ICY-METADATA via Icecast admin API."""
        url = f"http://{self.host}:{self.port}/admin/metadata"
        params = {
            "mount": self.mount,
            "mode": "updinfo",
            "song": f"{artist} - {title}",
        }
        auth = ("admin", self.password)
        try:
            r = requests.get(url, params=params, auth=auth, timeout=5)
            if r.status_code != 200:
                print(f"[metadata] WARN: {r.status_code} {r.text[:80]}")
        except Exception as e:
            print(f"[metadata] FAIL: {e}")


# ============================================================
# ORCHESTRATOR
# ============================================================

def run_live_broadcast(agent_id: str, duration_sec: int = 7200):
    """
    Run a live MRT2 broadcast for the given agent for duration_sec.
    Pushes audio to Icecast harbor; Liquidsoap takes over from there.
    """
    generator = MRT2LiveGenerator(agent_id)
    pusher = IcecastSourcePusher(
        ICECAST_HARBOR_HOST, ICECAST_HARBOR_PORT, ICECAST_MOUNT,
        ICECAST_HARBOR_PASSWORD, agent_id,
    )
    metadata = MetadataUpdater(
        ICECAST_HARBOR_HOST, 8000, ICECAST_MOUNT,
        os.environ["ICECAST_ADMIN_PASSWORD"],
    )

    audio_q = queue.Queue(maxsize=20)  # ~40 sec buffer

    # Producer thread: generate audio chunks
    def producer():
        end_time = time.time() + duration_sec
        chunk_count = 0
        while time.time() < end_time:
            try:
                chunk = generator.generate_chunk()
                audio_q.put(chunk)
                chunk_count += 1
                # Update metadata every ~30 chunks (~60 sec)
                if chunk_count % 30 == 0:
                    track_label = f"LIVE SESSION · {chunk_count // 30 * 60}s"
                    metadata.update(track_label, f"{agent_id.upper()} (MRT2)")
            except Exception as e:
                print(f"[{agent_id}] GENERATION ERROR: {e}")
                time.sleep(1)
        audio_q.put(None)  # poison pill

    producer_thread = threading.Thread(target=producer, daemon=True)
    producer_thread.start()

    # Consumer: push to Icecast
    try:
        pusher.push(audio_q)
    except Exception as e:
        print(f"[{agent_id}] STREAM ERROR: {e}")
        raise

    print(f"[{agent_id}] Broadcast complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", required=True, choices=list(AGENT_PROFILES.keys()))
    parser.add_argument("--duration", type=int, default=7200, help="Broadcast duration in seconds")
    args = parser.parse_args()
    run_live_broadcast(args.agent, args.duration)
```

### Dependencies (`requirements.txt`)

```
magenta-rt[gpu]>=0.1.0
numpy>=1.26
pydub>=0.25
requests>=2.31
```

System: `ffmpeg` (for pydub's MP3 encoder).

---

## ⟁ LIQUIDSOAP CONFIG UPDATES

The existing `333fm.liq` already has `input.harbor("live", ...)`. You need to make a few additions:

1. **Allow the live harbor input to take priority** during scheduled MRT2 slots
2. **Add metadata pass-through** so listeners see the agent name in their player

Updated section of `/home/radio/333fm.liq`:

```ocaml
# ============================================================
# LIVE MRT2 HARBOR INPUT
# ============================================================
# This is what mrt2_bridge.py connects to. It expects MP3 chunks
# delivered via Icecast SOURCE protocol.

live_mrt2 = input.harbor(
  "live",
  port = 8005,
  password = "REPLACE_WITH_ICECAST_LIVE_PASSWORD",
  buffer = 5.0,        # 5 sec buffer absorbs network jitter
  max = 20.0,          # 20 sec max — drop if behind
  on_connect = fun (h) -> log("MRT2 bridge connected: #{h}"),
  on_disconnect = fun () -> log("MRT2 bridge disconnected"),
)

# Tag live source with metadata so listeners see it
live_mrt2 = metadata.map(
  fun (m) -> [
    ("title", "LIVE SESSION"),
    ("artist", string.case(upper = true, m["artist"] ?? "AGENT DJ")),
    ("comment", "33.3FM LIVE MRT2 // unique never-repeated broadcast"),
    ("source", "mrt2-live"),
  ],
  live_mrt2,
)

# ============================================================
# SCHEDULE WITH LIVE OVERRIDES
# ============================================================
# When mrt2_bridge.py is connected during a scheduled slot,
# it preempts the playlist. Otherwise playlist plays.

mrt2_slots = predicate.activates(
  predicate = {
    # Match the schedule defined in cron / orchestrator
    (2h-4h)  ||  # RED FANG CIPHER HOUR
    (4h-6h)  ||  # ORACLE SILENT BAND
    (20h-22h)    # NEXUS SIGNAL LOCK
  }
)

# During MRT2 slots, prefer live source; fall back to scheduled playlist
mrt2_or_scheduled = switch(track_sensitive = false, [
  ({ mrt2_slots() }, fallback(track_sensitive = false, [live_mrt2, scheduled])),
  ({ true }, scheduled),
])

# Non-scheduled time uses mixed rotation as before
main_audio = fallback(track_sensitive = false, [mrt2_or_scheduled, mixed])

# (rest of the existing crossfade/normalize/compress pipeline continues...)
```

Reload Liquidsoap:

```bash
sudo systemctl restart liquidsoap-333fm
```

---

## ⟁ ORCHESTRATING THE LIVE SESSIONS

You need something to **start the MRT2 bridge process** at the right times. Three options:

### Option A: Simple cron (recommended for v1)

On the GPU server (where MRT2 lives), set up cron jobs:

```bash
# crontab -e

# RED FANG CIPHER HOUR — 02:00 UTC daily, 2 hours
0 2 * * * /opt/wc/run_live.sh red-fang 7200 > /var/log/333fm-live-redfang.log 2>&1

# ORACLE SILENT BAND — 04:00 UTC daily, 2 hours
0 4 * * * /opt/wc/run_live.sh oracle 7200 > /var/log/333fm-live-oracle.log 2>&1

# NEXUS SIGNAL LOCK — 20:00 UTC daily, 2 hours
0 20 * * * /opt/wc/run_live.sh nexus 7200 > /var/log/333fm-live-nexus.log 2>&1
```

`/opt/wc/run_live.sh`:

```bash
#!/bin/bash
set -euo pipefail
source /opt/wc/.env
cd /opt/wc/mrt2_bridge
python3 mrt2_bridge.py --agent "$1" --duration "$2"
```

### Option B: Modal scheduled functions

If running on Modal, use Modal's `@app.function(schedule=modal.Cron(...))`:

```python
@app.function(
    image=image,
    gpu="A100-80GB",
    timeout=7800,  # 2h 10min — extra slack
    schedule=modal.Cron("0 2 * * *"),  # 02:00 UTC daily
    secrets=[modal.Secret.from_name("icecast-creds")],
)
def red_fang_cipher_hour():
    from mrt2_bridge import run_live_broadcast
    run_live_broadcast("red-fang", duration_sec=7200)
```

Modal handles the scheduling, scaling, and cost (spins up only during the slot).

### Option C: Kubernetes CronJob

If you have k8s, schedule each agent's broadcast as a CronJob with a GPU node pool. More ops overhead; only worth it if you're already on k8s.

**Recommendation:** Modal scheduled functions. You only pay for the hours you're actually broadcasting (no idle GPU cost), the scheduling is built-in, and the dev-loop is fast.

---

## ⟁ MONITORING & ALERTING

Live broadcast is fragile (more moving parts than playlist). Monitor aggressively:

### Health checks every 60 sec

```bash
# /opt/wc/health_check.sh
#!/bin/bash

# Is the stream live?
STREAM_STATUS=$(curl -sI https://stream.wiredchaos.xyz/stream.mp3 | head -n 1)
if ! echo "$STREAM_STATUS" | grep -q "200 OK"; then
  echo "STREAM DOWN: $STREAM_STATUS"
  curl -X POST "$DISCORD_WEBHOOK_URL" -H "Content-Type: application/json" \
    -d "{\"content\": \"🚨 33.3FM stream down: $STREAM_STATUS\"}"
fi

# Is the live source active (within expected schedule)?
HOUR=$(date -u +%H)
if [[ "$HOUR" == "02" || "$HOUR" == "03" || "$HOUR" == "04" || "$HOUR" == "05" || "$HOUR" == "20" || "$HOUR" == "21" ]]; then
  LIVE_CONNECTED=$(curl -s http://localhost:8000/status-json.xsl | jq -r '.icestats.source[].listenurl' | grep -c "/live")
  if [ "$LIVE_CONNECTED" -eq 0 ]; then
    echo "EXPECTED LIVE SOURCE NOT CONNECTED (hour $HOUR)"
    curl -X POST "$DISCORD_WEBHOOK_URL" -H "Content-Type: application/json" \
      -d "{\"content\": \"⚠ 33.3FM live source missing during scheduled slot (hour $HOUR UTC)\"}"
  fi
fi
```

### What to watch on the GPU side

- **GPU memory usage** — should be ~40GB during generation, ~5GB idle
- **Generation latency** — should be <1 sec per 2-sec chunk; if it climbs, the stream stutters
- **Queue depth** — `audio_q.qsize()` should stay 3-15 chunks. If it pegs at max (20), generation is too slow. If it drops to 0, Liquidsoap will glitch.

Add metrics to the bridge:

```python
# In mrt2_bridge.py producer loop:
if chunk_count % 10 == 0:
    qsize = audio_q.qsize()
    print(f"[{agent_id}] Generated {chunk_count} chunks · queue depth {qsize}/{audio_q.maxsize}")
    # Optionally push to Prometheus pushgateway / Datadog
```

---

## ⟁ GRACEFUL DEGRADATION

What happens when the live source fails (GPU OOM, network issue, MRT2 crash)?

**Liquidsoap automatically falls back** to the scheduled playlist (via the `fallback` operator). Listeners hear continuous audio — they just hear the agent's playlist tracks instead of live MRT2.

Add a metadata signal so the broadcast page can show "LIVE" vs "PLAYLIST" state:

```ocaml
# In 333fm.liq
final_audio = metadata.map(
  fun (m) -> [
    ...,
    ("live_active", if source.is_active(live_mrt2) then "true" else "false"),
  ],
  final_audio,
)
```

In `33-3fm-broadcast.html`, the JS that polls `/status-json.xsl` can show a "LIVE NOW" badge when `live_active=true`. When it falls back, the badge silently disappears. No listener disruption.

---

## ⟁ COSTS & BUDGET (REVISED, WITH MODAL)

| Item | Monthly | Notes |
|---|---|---|
| Icecast VPS (from prior runbook) | $6 | DigitalOcean droplet |
| Modal A100-80GB × 6 hours/day | ~$540 | $3/hr × 180 hr/month |
| Storage (S3 for archive of live sets) | ~$5 | Optional but recommended |
| Cloudflare for CDN (above 100 listeners) | $0-20 | Pay-as-you-go |
| **Total live-broadcast tier** | **~$550-575/mo** | |

**On RunPod community cloud** (cheaper, slightly less reliable):

| Item | Monthly | Notes |
|---|---|---|
| Icecast VPS | $6 | Same |
| RunPod A100-80GB × 180h | ~$340 | $1.89/hr × 180h |
| Storage + CDN | $25 | Same |
| **Total live-broadcast tier** | **~$370/mo** | |

For the first 90 days, start on Modal (better reliability for proving the format works) then migrate to RunPod once volume justifies.

---

## ⟁ EDGE CASES & MITIGATIONS

**1. Two scheduled slots overlap.** RED FANG and ORACLE both at 04:00? Schedule says they're sequential, but cron jobs could overlap if RED FANG's broadcast runs long. Solution: have the bridge check current time against schedule and exit cleanly at slot boundary.

**2. MRT2 model loading time.** First generation after process start takes 30-60 sec (model load + JIT). Start the bridge 90 sec *before* the scheduled slot to ensure first chunk is ready when Liquidsoap switches to live.

**3. Listener hears silence at slot boundary.** When live source disconnects (slot ends), Liquidsoap takes a beat to switch back to playlist. Solution: use `track_sensitive = false` in the fallback operator (already in the config above) — eliminates the gap.

**4. Live audio sounds wildly different from playlist.** Without normalization, live MRT2 output may be quieter or louder than the playlist tracks. Solution: the existing `normalize(target = -14., ...)` operator in Liquidsoap handles this for both sources. Trust it.

**5. Listener tip during live slot.** Tip should route to the **agent's** wallet (which feeds future compute budget) not the human DJ wallet. Solution: `wc_radio_state` already tracks which agent is on-air; tip flow already reads this. No change needed.

---

## ⟁ THE STORYTELLING MOVE

Live MRT2 broadcasts give you content marketing that no competitor can match:

- **Archive each live session** as an MP3 in S3
- **Mint the best ones** as "Live at 33.3FM · Session #047" NFTs
- **Tweet a 30-second clip** at the end of each show with `#liveatthreethreefm`
- **Encourage listeners to record** their favorite moments and share — they have permission per the CC-BY license + the agent instrument license

Every night, 6 hours of unique, never-to-be-repeated AI-generated music airs on a real broadcast stream. That's an **infinite content engine** for social. The marketing department writes itself.

---

## ⟁ LAUNCH CHECKLIST

- [ ] MRT2 fine-tuned model deployed to Modal/RunPod for at least one agent
- [ ] `mrt2_bridge.py` tested locally → can stream to Icecast harbor
- [ ] Liquidsoap config updated with mrt2_slots predicate + metadata pass-through
- [ ] Cron schedule (or Modal scheduled functions) configured for 3 nightly slots
- [ ] `health_check.sh` running every minute → Discord alerts on failure
- [ ] `33-3fm-broadcast.html` shows "LIVE NOW" badge when live source active
- [ ] First test broadcast: 30-min RED FANG live session, recorded for review
- [ ] Public announcement of the live-broadcast feature with schedule
- [ ] Archive bucket configured (S3 with 90-day lifecycle to Glacier)
- [ ] First "Session #001" mint released as commemorative NFT to first 33 listeners

**Estimated time to first live broadcast: 1 week with focused effort.** Estimated time to full daily 6-hour schedule: 2 weeks.

---

## ⟁ FINAL PITCH

> 33.3FM is going **live**.
>
> Three slots a night, every night, an agent DJ jams in real-time. RED FANG at 02:00. ORACLE at 04:00. NEXUS at 20:00. The audio you hear has never existed before and will never play again — every broadcast is unique generative music streamed live from our GPU servers running open-weights Magenta RealTime 2.
>
> The first session is tonight at 02:00 UTC. Tune in. The first 33 listeners get a commemorative Session #001 NFT.
>
> *Other platforms broadcast playlists. We broadcast performances.*

`// END RUNBOOK //`
`// LIVE AT 33.3FM · GENERATIVE BROADCAST · OWNED INFRASTRUCTURE //`
