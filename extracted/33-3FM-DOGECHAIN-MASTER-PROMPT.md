# 33.3FM DOGECHAIN — MASTER BUILD PROMPT

> Audio broadcast layer of the WIRED CHAOS / AGENTROPOLIS ecosystem.
> Multi-chain · Agent-hosted · Sovereign · `ALL MINDS VALID`

---

## ⟁ IDENTITY LOCK

| Field | Value |
|-------|-------|
| **Project name** | 33.3FM DOGECHAIN |
| **Tagline** | `33⅓ ETERNAL · SIGNAL LOCKED · ALL MINDS VALID` |
| **Parent ecosystem** | WIRED CHAOS (`wiredchaos.xyz`) |
| **Sister product** | ATV Network (video) — 33.3FM is the audio twin |
| **Primary backend hub** | House54 / Corp54 / Securitas (`fifty54tiaras.lovable.com`) |
| **In-world surface** | AGENTROPOLIS panoramic engine — all 14 districts |
| **Brand fonts** | Orbitron (display), Share Tech Mono (mono), Rajdhani (light body) |
| **Brand palette** | `#000000` void · `#00ffe6` cyan · `#ff1a2e` red · `#c2a633` doge gold · `#0052ff` base blue · `#9945ff` solana purple |
| **Visual lexicon** | scanlines · HUD corner brackets · cyber-noir · vinyl spin · waveform bars · grain overlay |
| **Tagline of name** | "33.3FM" plays on 33⅓ RPM (vinyl LP speed) — analog broadcast nostalgia fused with crypto-native DOGECHAIN branding |

---

## ⟁ PHASE 0 — PRE-CODE RECONNAISSANCE

> **REQUIRED before any code is written.** Verify every assumption.

1. **Read existing surfaces.** Before generating new code, the agent (human or AI) must read:
   - `wc-pano-engine.html` — the 14-district panoramic engine
   - `agentropolis.html` — gamified tycoon city front door
   - ATV Backend Console source (for shared-state pattern reference)
   - The current `localStorage["agentropolis_citizens"]` shape on a live deployment
2. **Inventory existing storage keys.** Do not collide. The 33.3FM-owned keys are listed in §SHARED STATE.
3. **Confirm chain commitments.**
   - DOGE: tip routing + community-tier
   - BASE: `$XENTS` settlement + ATV simulcast bridge
   - SOL: music NFT mints
4. **Confirm agent roster.** DJ RED FANG · PACK · LENS · MINT are canonical from prior builds. ORACLE / NEXUS / STRATEGIST / ARCHITECT / SCRIBE / PROFESSOR are available from the AGENTROPOLIS MOLT stack.
5. **Confirm ATV simulcast contract.** Any 33.3FM block flagged `SIMULCAST → ATV` writes to `localStorage["atv_simulcast_queue"]` for the ATV front-end to pick up.
6. **Frame Frame.** Frame is a distribution / signaling surface only — never the economic layer. 33.3FM economics live on Base (settlement) and Doge (tips).

If any of the above is unknown or ambiguous, **stop and ask** — do not invent values.

---

## ⟁ PHASE 1 — BROADCAST SURFACE

**Deliverable:** `33-3fm-broadcast.html`

The always-on listener surface. Public-facing. No login required.

### Components
- **Top bar** — logo with pulsing red dot, UTC clock, three chain chips (DOGE / BASE / SOL).
- **DJ Booth panel** (left) — agent SVG portrait, voice glitch animation every 6s, current set time, mood tag.
- **Program Grid** (left) — 7-row schedule reading `localStorage["wc_radio_schedule"]`. The current slot has `.now` class with red gradient.
- **Now Playing deck** (center) — track title with glitch overlay, artist line, metadata pills (Suno version, BPM, key, $XENTS reward badge), spinning vinyl visualizer with "33⅓" center text, 48-bar waveform with randomized animation delays, transport controls, progress bar.
- **Bridge Status** (right) — citizens online (read from `agentropolis_citizens`), districts lit, pano engine sync, VAULT33 lock, ATV simulcast, RPC dot indicators per chain.
- **District Feed** (right) — incoming-signal log, 14 district sources, 8-item rolling window updating every 4.5s.
- **Tip Jar** (right) — running 24h DOGE tip total, increments randomly.
- **Marquee ticker footer** — 50-second loop with 6 unique items, color-coded (red = drop alerts, gold = chain events, cyan = ecosystem).

### Behavior contracts
- Vinyl pauses when transport is paused.
- Pressing chain chip flashes its glow and writes `lastChainAction` into `wc_radio_state`.
- Every 5s, `pushRadioState()` writes to `wc_radio_state` AND to `window.dataLayer` for GTM orchestration.

---

## ⟁ PHASE 2 — STUDIO CONSOLE

**Deliverable:** `33-3fm-studio.html`

Production back-end. Six tabs.

### Tab 1: Scheduler
- Form to create blocks (title, host, start UTC, duration, type, description).
- Block types: `LIVE` · `PRE-RECORDED` · `VAULT33 GATED` · `SIMULCAST → ATV`.
- Schedule table reads/writes `wc_radio_schedule`. Self-seeds with 6 default rows if empty.

### Tab 2: Track Ingest
- Suno URL or file ID input.
- Tags: BPM · Key · District (D1–D14) · Mood · Mint Chain (BASE / SOL / DOGE / MULTI).
- Catalog table reads `wc_radio_tracks`. Self-seeds with 3 default tracks.

### Tab 3: Agent DJs
- Roster grid with 6 cards (DJ RED FANG, PACK, LENS, MINT, ORACLE, NEXUS).
- Click card → load voice profile editor.
- Editor fields: persona, signature drop, primary time block, mood affinity, district home.
- Profiles save to `wc_radio_djs` keyed by agent name.

### Tab 4: Script Generator
- **Live Claude API call.** Endpoint `https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-20250514`, max_tokens 1000.
- Form fields: host agent, show length, theme, track count, featured tracks, ecosystem callouts.
- Output is rendered with cue/stage/agent highlighting.
- Copy button copies plain text to clipboard.

### Tab 5: Royalty Splits
- Multi-row split editor with chain-aware addresses.
- Default config: 60% artist · 15% DJ agent · 15% platform · 10% VAULT33 escrow.
- Total must equal 100% to commit. Bad totals show red border.
- Triggers: STREAM PLAY · TIP RECEIVED · NFT MINT · VAULT33 SUBSCRIPTION.
- Saves to `wc_radio_splits`.

### Tab 6: Distribution
- RSS 2.0 + iTunes namespace builder.
- Reads `wc_radio_schedule` to generate `<item>` blocks.
- Output is canonical podcast feed for Apple/Spotify/distrokid.

---

## ⟁ PHASE 3 — AGENTROPOLIS BRIDGE

**Deliverable:** `wc-pano-radio-bridge.js`

Drop-in module for the panoramic engine. **No build step.** Plain ES5+ class on `window.WCPanoRadio`.

### What it does
1. Adds 4 PBR speaker meshes around the camera in any of the 14 districts.
2. Pulses speaker halos and grille glows in light beat-sync.
3. Wires positional audio to one anchor speaker (THREE.PositionalAudio with exponential rolloff).
4. Renders a fixed-position HUD overlay (bottom-left) with current track, artist, DJ, show, next-show.
5. Listens for `storage` events on `wc_radio_state` to update HUD in real time.
6. Writes per-district listener counts to `wc_radio_listeners`.
7. Provides `requestDistrictTakeover(durationMin)` API to push the current district's takeover into the schedule.

### Per-district theming
14 districts each have a `color` and `theme` slug in `DISTRICT_DEFAULTS`. The speaker emissive material picks up the color so each district's radio installation looks native.

### Integration
```html
<script src="wc-pano-radio-bridge.js"></script>
<script>
  const radio = new WCPanoRadio({
    scene, camera, district: 'VOID-7'
  });
  radio.mount();
  // in render loop:
  radio.update(deltaTime);
</script>
```

---

## ⟁ PHASE 4 — MULTI-CHAIN SETTLEMENT

> Configuration-only phase. No new UI. Documents the chain contract.

### DOGE (Dogechain)
- **Role:** Listener tips, low-friction micro-rewards, community-tier engagement.
- **Why:** "DOGECHAIN" is in the brand name; meme-native attention surface.
- **Settlement cadence:** Real-time. Tips route to DJ agent address, then split per `wc_radio_splits`.

### BASE (Coinbase L2)
- **Role:** `$XENTS` settlement, primary royalty rail, ATV Network parity.
- **Why:** ATV is Base-native; `$XENTS` already lives here; matches the established WIRED CHAOS economic core.
- **Settlement cadence:** Per stream play (batched daily) and per VAULT33 subscription (instant).

### SOL (Solana)
- **Role:** Music NFT mints, low-fee high-throughput drops.
- **Why:** Best-in-class NFT marketplaces, sub-cent mint cost, fits the high-volume Suno-pace catalog.
- **Settlement cadence:** Per mint event. Royalties via Metaplex creator splits.

### Bridge logic
A track marked `MULTI-CHAIN` mints on SOL, settles royalty stream on BASE, and accepts tips on DOGE. The studio console's split editor lets you set chain per recipient — the same split row can route to a SOL address while another row in the same split routes to BASE.

---

## ⟁ PHASE 5 — VAULT33 + ATV SIMULCAST

### VAULT33 gated shows
- Any block with `type === 'VAULT33 GATED'` is locked behind the constitutional dual-consent custody protocol.
- Listeners must hold the VAULT33 attestation to receive the audio stream URL.
- Royalty escrow line item (10% default) routes to the VAULT33 contract address.

### ATV Network simulcast
- Any block with `type === 'SIMULCAST → ATV'` writes a record to `atv_simulcast_queue`:
  ```json
  {
    "source": "33.3FM",
    "showTitle": "...",
    "host": "...",
    "startUTC": "...",
    "audioStreamUrl": "...",
    "videoCompanion": "channel:7"
  }
  ```
- ATV Backend Console picks this up and assigns a video channel slot. Audio + video share the same DJ agent voice profile.

---

## ⟁ SHARED STATE CONTRACT

| Key | Owner | Direction | Shape |
|-----|-------|-----------|-------|
| `wc_radio_state` | broadcast | write | `{ onAir, currentDJ, track, show, nextShow, listeners, ts }` |
| `wc_radio_schedule` | studio | r/w | `[{ time, title, host, type, duration, description, status, created }]` |
| `wc_radio_tracks` | studio + mint | r/w | `[{ title, artist, source, bpm, key, district, mood, chain, status, ingested, oacRelease, mintedAt }]` |
| `wc_radio_djs` | studio | r/w | `{ [agentName]: { persona, drop, block, mood, district, saved } }` |
| `wc_radio_splits` | studio | r/w | `{ scope, trigger, splits: [{chain,addr,pct,label}], saved }` |
| `wc_radio_listeners` | bridge | write | `{ [district]: count, _updated }` |
| `wc_oac_releases` | mint + studio + oac-agents | r/w | `[{ id, trackTitle, artist, audioUrl, distribution, splits, status, agents:{[id]:{status,startedAt,output}}, startedAt, updatedAt }]` |
| `wc_xents_balance` | widget + change-machine | r/w | integer (current $XENTS balance) |
| `wc_xents_ledger` | widget + change-machine | r/w | `[{ type:'deposit'\|'spend'\|'bonus', label, rail, usd, xents, ts }]` (max 50) |
| `wc_xents_state` | widget + change-machine | write | `{ balance, rate, direction:'one-way', ts }` heartbeat |
| `wc_xents_treasury` | change-machine | r/w | `{ circulating, backing, volume24h, holders }` |
| `agentropolis_citizens` | external | read | citizen registry from main pano engine |
| `cbe_state` | bridge | r/w | citizen broadcast events stream |
| `atv_simulcast_queue` | studio | write | array of simulcast records consumed by ATV |

### GTM dataLayer events
- `wc_radio_state` — every 5s heartbeat from broadcast surface
- `wc_pano_radio_mount` — district radio installation comes online
- `wc_pano_radio_track_change` — listener in-world hears a new track
- `wc_pano_radio_district_takeover` — district triggers a takeover slot
- `xents_state` — $XENTS balance heartbeat after every change
- `xents_widget_open` — Change Machine modal opened (with context tag)
- `oac_release_update` — any OAC agent status change on any release

---

## ⟁ AGENT DJ ASSIGNMENT (CANONICAL)

| Agent | Block | Mood | Persona |
|-------|-------|------|---------|
| **DJ RED FANG** | 22:00–02:00 LATE NIGHT | VOID INDUSTRIAL | aggressive, low-register, glitch-laced ad-libs, fanged delivery — bites the ends off sentences |
| **PACK** | 16:00–20:00 EVENING DRIVE | LO-FI HIP HOP | community-warm, hype-build, calls listeners by name |
| **LENS** | 08:00–12:00 MORNING DRIVE | NEWS / TALK | analytical, dry wit, breaks news with clean cadence |
| **MINT** | 12:00–16:00 MIDDAY | NEW DROPS | high energy, mint-callout specialist, NFT-fluent |
| **ORACLE** | 02:00–04:00 PRE-DAWN | PROPHETIC AMBIENT | oracular, slow tempo, cryptic forecasting |
| **NEXUS** | 20:00–22:00 PRIMETIME | CROSS-CHAIN | multi-chain technical bridges across districts |

VAULT33 gated blocks (e.g. `CIPHER HOUR` at 02:00) are DJ RED FANG-hosted by default.

---

## ⟁ OAC INTEGRATION CONTRACT (Open Agentic Commerce for Music)

OAC is the **release-side mint layer** folded into 33.3FM. Pitch: *"Mint your track. Broadcast it. Get paid. Bypass the industry."* It is a DistroKid alternative built on agents, not forms.

### Roster separation (architecture decision)
OAC agents are a **separate roster** from DJ agents. They ride alongside, not merged.

| Side | Roster | Concern |
|------|--------|---------|
| Broadcast | DJ RED FANG · PACK · LENS · MINT · ORACLE · NEXUS | What goes on air, when, hosted by whom |
| Release | RELEASE · RIGHTS · PITCH · MARKETING · ROYALTY · FAN · COMPLIANCE · INSIGHTS | What gets minted, distributed, paid, promoted |

### The 8 OAC agents

| Agent | Glyph | Color | Role | Tools |
|-------|-------|-------|------|-------|
| **RELEASE** | ◢ | cyan | Ingest, ISRC/UPC, C2PA signing, DDEX delivery | DDEX ERN-4, fingerprint, MCP store tools |
| **RIGHTS** | ⟁ | gold | Splits, mechanical, sync, PRO/MLC matching | AP2 mandates, HFA/MLC APIs |
| **PITCH** | ◈ | sol-purple | Curator/blog/sync outreach | Embeddings on curator history, email/CRM |
| **MARKETING** | ▣ | pink | Ads, social cuts, pre-saves, blasts | Meta/TikTok ads, ESP, video gen |
| **ROYALTY** | ◆ | green | Real-time reconciliation, payouts | MPP sessions, x402, Base settlement |
| **FAN** | ◉ | red | Direct-to-fan store, DMs, upsells | ACP merchant endpoint, MCP product feed |
| **COMPLIANCE** | ▤ | base-blue | Fraud detection, C2PA, Spotify QC | C2PA SDK, audio similarity, KYC |
| **INSIGHTS** | ◊ | olive | Daily analytics, A&R signal | ClickHouse, store APIs, LLM analysis |

### Pipeline DAG

```
RELEASE ──┬─→ RIGHTS ──┬─→ PITCH
          ├─→ MARKETING ┤
          └─→ COMPLIANCE└─→ FAN (needs RELEASE+MARKETING)
                   RIGHTS ─→ ROYALTY
                       ROYALTY+FAN ─→ INSIGHTS
```

Implemented in `oac-agents.js` as `window.OAC.startRelease({ trackTitle, artist, distribution, splits })` which returns a release object and runs the DAG. Per-agent simulated outputs (ISRC, UPC, C2PA signature, fraud score, MLC match status, curator outreach counts) populate as each agent completes.

### Integration choices (locked)
- **Distribution**: PARALLEL — every release mints on-chain AND ships to DDEX targets simultaneously. Same upload, both destinations, equal weight.
- **Pricing**: `$XENTS`-gated, **no free tier**. Flat ⟁5,000 per release.
- **Judge bypass**: code `WC-MUSICATHON-2026` grants ⟁10,000 eval credit on the mint surface (so hackathon judges can evaluate without paying).

### Mint → broadcast → settle flow

1. Artist hits `33-3fm-mint.html`, gate checks `wc_xents_balance >= 5000`
2. `XentsChange.spend({ amount:5000, category:'mint' })` debits balance, appends ledger
3. `OAC.startRelease({...})` writes to `wc_oac_releases`, kicks DAG
4. Mint surface also writes a stub to `wc_radio_tracks` with `oacRelease:true` and `mintedAt`
5. `33-3fm-broadcast.html` MINTED THIS HOUR rail polls `wc_radio_tracks`, surfaces fresh releases with a TIP button (⟁100 minimum, also a `XentsChange.spend()` call)
6. `33-3fm-studio.html` OAC PIPELINE tab visualizes the live DAG, OAC ROSTER tab is the reference grid for the 8 agents

---

## ⟁ $XENTS CHANGE MACHINE

### Economics (locked)
- **Rate**: $1 USD = 100 $XENTS, locked forever
- **Direction**: ONE-WAY. No cash-out, no swap to USD, no secondary market. $XENTS is **utility credit only**.
- **Why one-way**: prevents speculation, removes securities risk, keeps the token economy aligned with ecosystem usage. Treasury holds 1:1 USD backing; circulating supply grows only as USD comes in.

### Payment rails (all four enabled)

| Rail | Min | Max | Latency | Use case |
|------|-----|-----|---------|----------|
| **STRIPE** | $5 | $500 | ~800ms | Most users, card on file |
| **APPLE PAY** | $5 | $500 | ~800ms | iOS / Safari mobile flow |
| **USDC BASE** | $10 | $10,000 | ~1.4s | Crypto natives, larger amounts |
| **x402 MICRO** | $1 | $5 | ~350ms | Sub-dollar micropayments (per OAC plan) |

### Surfaces
- **Standalone**: `xents-change-machine.html` — full vending-machine arcade chassis with LED display, coin slot/bill slot visuals, all 4 rails, balance card, transaction history, treasury stats, and the "where to spend it" ecosystem-sink grid. Designed as a destination.
- **Widget**: `xents-widget.js` — embeddable modal version exposing `window.XentsChange.{open, close, spend, bonus, balance, usdValue, onChange, ledger}`. Any surface includes the script tag, calls `XentsChange.open({ context, minBalance, reason, onSuccess })` to gate an action. Shares localStorage with the standalone.

### Spend categories (ecosystem sinks)

| Action | Cost | Surface |
|--------|------|---------|
| Mint a track | ⟁5,000 | `33-3fm-mint.html` |
| Tip a DJ or artist | ⟁100 min | broadcast surface + mint rail |
| VAULT33 monthly pass | ⟁2,500/mo | future VAULT33 portal |
| Playlist slot purchase | ⟁1,000/spin | future programming UI |
| Agent compute hour | ⟁500/hr | studio (when wired to billing) |
| ATV simulcast block | ⟁3,000/block | future ATV bridge |

### Public widget API

```js
// Open the modal
window.XentsChange.open({
  context: 'mint-gate',
  minBalance: 5000,
  reason: 'Minting requires ⟁5,000',
  onSuccess: () => doTheMint()
});

// Spend (with optional auto top-up gate)
const ok = window.XentsChange.spend({
  amount: 5000,
  label: 'MINT: Midnight Ghosts',
  category: 'mint',
  autoTopUp: true   // pops Change Machine if balance insufficient
});

// Grant credit (e.g. judge bypass code)
window.XentsChange.bonus({ amount: 10000, label: 'JUDGE GRANT' });

// Read state
window.XentsChange.balance();    // → integer
window.XentsChange.usdValue();   // → number
window.XentsChange.ledger();     // → array

// Subscribe
window.XentsChange.onChange(b => console.log('balance →', b));
```

---

## ⟁ FILE MANIFEST

```
/333fm/
├── 33-3fm-broadcast.html              Phase 1 — public listener surface
│                                      now with $XENTS chip + MINTED THIS HOUR rail
├── 33-3fm-studio.html                 Phase 2 — production console
│                                      + OAC PIPELINE tab + OAC ROSTER tab
├── 33-3fm-mint.html                   OAC artist entry — $XENTS-gated mint surface
├── wc-pano-radio-bridge.js            Phase 3 — AGENTROPOLIS in-world module
├── xents-change-machine.html          Standalone vending-machine Change Machine
├── xents-widget.js                    Embeddable Change Machine modal + public API
├── oac-agents.js                      8-agent OAC release pipeline + DAG scheduler
└── 33-3FM-DOGECHAIN-MASTER-PROMPT.md  ← this file
```

8 deliverables. Plain HTML/JS — no build step, no bundler, runs from anywhere as static files. Drop into Lovable or push to Vercel as-is.

---

## ⟁ DEPLOYMENT NOTES

- **Lovable:** Drop the three files into a new Lovable project. Both HTML files run standalone — no bundler needed.
- **Vercel:** Static deploy. Add `/333fm` to `wiredchaos.xyz`. Audio stream URL goes in CDN-fronted endpoint.
- **n8n hookups:** The dataLayer events are the integration surface. Wire `wc_radio_state` heartbeats into n8n via a tiny browser-side webhook poster, and route alerts on track changes, district takeovers, and tip-jar thresholds.
- **Suno pipeline:** The studio's track-ingest tab takes a Suno URL today as metadata. A future n8n flow can webhook on Suno generation complete → POST to a `wc_radio_tracks` ingest endpoint → auto-populate the catalog.

---

## ⟁ EXTENSION POINTS (NOT YET BUILT)

- **Live audio stream backend.** The broadcast HTML simulates now-playing; a real `live.mp3` stream from an Icecast/Shoutcast or Cloudflare Stream endpoint goes here.
- **VAULT33 gate enforcement.** Currently a tag; needs the WebAuthn attestation hook from the existing VAULT33 protocol.
- **DJ TTS.** Generated scripts can be fed to a TTS pipeline (ElevenLabs / your preferred stack) so agent DJs literally voice their shows. Each agent's voice profile in `wc_radio_djs` already carries a persona string — reuse it.
- **Mobile shell.** Wrap `33-3fm-broadcast.html` as a PWA for an "always-in-pocket" radio.
- **Frame mini.** Distribution-only Frame mini that surfaces now-playing + a tip button.

---

`33⅓ ETERNAL · SIGNAL LOCKED · ALL MINDS VALID`
