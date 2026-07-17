# 33.3FM ICECAST BROADCAST — PRODUCTION RUNBOOK

> **Goal:** Take 33.3FM from "concept with player UI" to "actually transmitting 24/7." A single $5/mo VPS, Icecast2 as the streaming server, Liquidsoap as the playlist/automation engine, and a starter rotation of legally-cleared content. Single biggest legitimacy unlock for the platform.

**Time budget:** First broadcast on-air within 4 hours of starting. Production-ready hardening in another 4. Total ~1 working day.

---

## ⟁ ARCHITECTURE

```
┌────────────────────┐
│ Playlist sources   │
│ - Free Music       │
│   Archive (CC)     │
│ - Lyria-generated  │
│   agent tracks     │
│ - User OAC mints   │
│   (after rights    │
│    check)          │
└──────────┬─────────┘
           │ scheduled by
           ▼
┌────────────────────┐         ┌──────────────────┐
│ Liquidsoap         │────────▶│ Icecast2         │
│ (DJ automation +   │  source │ (HTTP streaming  │
│  crossfade + xfade │  audio  │  server)         │
│  + DJ voice tags)  │         │                  │
└────────────────────┘         └────────┬─────────┘
                                        │ HTTP audio
                                        │ /stream.mp3
                                        ▼
                               ┌──────────────────┐
                               │ Listeners        │
                               │ - 33-3fm-        │
                               │   broadcast.html │
                               │ - Mobile apps    │
                               │ - Any audio      │
                               │   player         │
                               └──────────────────┘
```

**Why this stack:**
- **Icecast2** is the open-source, battle-tested HTTP audio streaming server. Same tech that powers SomaFM, RadioParadise, thousands of indie stations. Stable for decades.
- **Liquidsoap** is the de-facto automation engine. Scriptable in its own DSL, handles crossfade/normalization/scheduling/live-DJ-takeover natively.
- **No SaaS dependency.** You own the server, you own the stream, you own the brand. $5/mo gets you started; $20/mo handles 1000+ concurrent listeners.

---

## ⟁ PHASE 1 — PROVISION A SERVER (15 MIN)

### Option A: DigitalOcean (recommended for v1)

1. Sign up at https://digitalocean.com (free $200 credit with most referrals)
2. Create Droplet:
   - **Image:** Ubuntu 24.04 LTS x64
   - **Size:** Basic · Regular · $6/mo (1GB RAM, 1 CPU, 25GB SSD, **1TB bandwidth**)
   - **Region:** Closest to your largest audience (NYC3 for US East, AMS3 for EU)
   - **Authentication:** SSH key (not password — security)
   - **Hostname:** `333fm-stream-01`
3. After creation, copy the public IPv4 (e.g. `159.65.xxx.xxx`)

### Option B: Hetzner (cheaper, EU-based)

CX22: 2vCPU / 4GB / 40GB for €4.51/mo. Better value if your audience is EU-centric.

### DNS

Add an A record pointing `stream.wiredchaos.xyz` → your VPS IP. Wait 5-15 min for propagation.

### Initial hardening

```bash
ssh root@stream.wiredchaos.xyz

# Update
apt update && apt upgrade -y

# Create non-root user
adduser radio
usermod -aG sudo radio
rsync --archive --chown=radio:radio ~/.ssh /home/radio

# Firewall
ufw allow OpenSSH
ufw allow 8000/tcp  # Icecast public stream port
ufw allow 80/tcp    # nginx (for TLS reverse proxy later)
ufw allow 443/tcp   # nginx HTTPS
ufw enable

# Disable root SSH
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload sshd

# Switch to radio user for everything below
su - radio
```

---

## ⟁ PHASE 2 — INSTALL ICECAST2 (10 MIN)

```bash
sudo apt install icecast2 -y
```

The installer asks 4 questions. Answer them carefully — these passwords protect your stream:

- **Configure Icecast2?** → Yes
- **Icecast2 hostname:** `stream.wiredchaos.xyz`
- **source password:** `[generate a strong one]` — Liquidsoap uses this to push audio
- **relay password:** `[same or different strong one]`
- **administration password:** `[strong one, different from source]`

Save these in a password manager NOW. You'll need them throughout.

Edit `/etc/icecast2/icecast.xml`:

```xml
<icecast>
    <location>33.3FM // WIRED CHAOS</location>
    <admin>ops@wiredchaos.xyz</admin>

    <limits>
        <clients>1000</clients>
        <sources>4</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <burst-on-connect>1</burst-on-connect>
        <burst-size>65535</burst-size>
    </limits>

    <authentication>
        <source-password>YOUR_SOURCE_PASSWORD</source-password>
        <relay-password>YOUR_RELAY_PASSWORD</relay-password>
        <admin-user>admin</admin-user>
        <admin-password>YOUR_ADMIN_PASSWORD</admin-password>
    </authentication>

    <hostname>stream.wiredchaos.xyz</hostname>

    <listen-socket>
        <port>8000</port>
    </listen-socket>

    <fileserve>1</fileserve>

    <paths>
        <basedir>/usr/share/icecast2</basedir>
        <logdir>/var/log/icecast2</logdir>
        <webroot>/usr/share/icecast2/web</webroot>
        <adminroot>/usr/share/icecast2/admin</adminroot>
        <alias source="/" destination="/status.xsl"/>
    </paths>

    <logging>
        <accesslog>access.log</accesslog>
        <errorlog>error.log</errorlog>
        <loglevel>3</loglevel>
    </logging>
</icecast>
```

Enable + start:

```bash
sudo sed -i 's/ENABLE=false/ENABLE=true/' /etc/default/icecast2
sudo systemctl enable icecast2
sudo systemctl start icecast2
sudo systemctl status icecast2
```

Test in browser: `http://stream.wiredchaos.xyz:8000` should show the Icecast admin page. If it doesn't, check firewall (`ufw status`) and Icecast logs (`/var/log/icecast2/error.log`).

---

## ⟁ PHASE 3 — INSTALL LIQUIDSOAP (10 MIN)

Liquidsoap 2.x is in Ubuntu 24.04 repos but a bit old. Install the newer official build:

```bash
# Add Savonet repo
curl -s https://liquidsoap.info/savonet.gpg | sudo gpg --dearmor -o /usr/share/keyrings/savonet.gpg
echo "deb [signed-by=/usr/share/keyrings/savonet.gpg] https://liquidsoap.info/repos/savonet/ubuntu noble main" | sudo tee /etc/apt/sources.list.d/savonet.list
sudo apt update
sudo apt install liquidsoap -y

# Verify
liquidsoap --version
```

Should report 2.2.x or newer.

---

## ⟁ PHASE 4 — SEED PLAYLIST (45 MIN)

This is the part most stations get wrong. **You cannot legally play arbitrary music** even if it's "for free" — you'd be liable for performance royalties. Your starter playlist comes from three sources:

### Source A: Free Music Archive (Creative Commons)

```bash
mkdir -p /home/radio/music/starter
cd /home/radio/music/starter

# FMA has API. For v1, manually curate ~50 tracks across genres matching
# 33.3FM's aesthetic. Recommended CC0/CC-BY artists:
#   - Kevin MacLeod (incompetech.com) - cinematic / synthwave
#   - Lee Rosevere - lo-fi / ambient
#   - Komiku - electronic / experimental
#   - Chad Crouch - drone / soundscape
# All explicitly allow commercial broadcast under CC-BY (attribution required).

# Quick batch download example for one artist:
wget -r -np -nH --cut-dirs=3 --accept=mp3 \
  https://freemusicarchive.org/music/Kevin_MacLeod/
```

### Source B: Lyria-generated agent music

Your Lyria Engine generates these. Place them in:

```bash
mkdir -p /home/radio/music/agents/{red-fang,pack,lens,mint,oracle,nexus}
```

Each agent DJ's persona dictates 4-6 hours of Lyria-generated tracks (you've already seeded 17 in `wc-seed.js`). Push the actual MP3 files to the server:

```bash
# From your local machine:
rsync -avz ~/lyria-output/red-fang/ radio@stream.wiredchaos.xyz:/home/radio/music/agents/red-fang/
```

### Source C: User-minted tracks (after rights check)

Eventually, your `wc_oac_releases` get rotated in. For v1, keep this manual — only push tracks where the OAC `Compliance` agent has cleared C2PA + fraud score. Auto-ingest is a v2 feature.

### Tag the music properly

Liquidsoap reads ID3 tags. Every file needs:

```
ARTIST: DJ RED FANG
TITLE: CIPHER PROTOCOL
ALBUM: WIRED CHAOS // ROTATION
GENRE: Phonk
COMMENT: licence=cc-by; mood=industrial; bpm=88; lyria-gen=true
```

For batch tagging, use `id3v2` or `eyeD3`:

```bash
sudo apt install eyed3 -y
eyeD3 -a "DJ RED FANG" -t "CIPHER PROTOCOL" \
      -G "Phonk" --comment="mood=industrial;bpm=88" \
      /home/radio/music/agents/red-fang/cipher-protocol.mp3
```

---

## ⟁ PHASE 5 — LIQUIDSOAP CONFIG (45 MIN)

This is the brain. Save as `/home/radio/333fm.liq`:

```ocaml
#!/usr/bin/env liquidsoap

# ============================================================
# 33.3FM // BROADCAST AUTOMATION
# Liquidsoap script
# ============================================================

# Settings
settings.log.file := true
settings.log.file.path := "/home/radio/logs/333fm.log"
settings.log.level := 3

# Crossfade duration (seconds)
fade_duration = 3.0

# ============================================================
# CONTENT POOLS
# ============================================================

# Each agent DJ has their own playlist directory
red_fang = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/red-fang"
)

pack = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/pack"
)

lens = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/lens"
)

mint = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/mint"
)

oracle = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/oracle"
)

nexus = playlist(
  mode = "randomize",
  reload = 600,
  reload_mode = "rounds",
  "/home/radio/music/agents/nexus"
)

# Fallback / starter pool (CC content + any non-categorized tracks)
fallback_pool = playlist(
  mode = "randomize",
  reload = 1200,
  reload_mode = "rounds",
  "/home/radio/music/starter"
)

# ============================================================
# SCHEDULE (matches 33-3fm-broadcast.html slot grid)
# ============================================================
# 04:00-06:00 → ORACLE  (silent band / drone)
# 07:00-09:00 → LENS    (morning drive)
# 12:00-14:00 → MINT    (midday drift)
# 18:00-20:00 → PACK    (evening drive)
# 20:00-22:00 → NEXUS   (signal lock)
# 02:00-04:00 → RED FANG (cipher hour)
# all other slots → mixed agents rotation

scheduled = switch([
  ({ 2h-4h }, red_fang),
  ({ 4h-6h }, oracle),
  ({ 7h-9h }, lens),
  ({ 12h-14h }, mint),
  ({ 18h-20h }, pack),
  ({ 20h-22h }, nexus),
])

# Mixed rotation for filler slots — random agent + fallback
mixed = random(weights = [1, 1, 1, 1, 1, 1, 2], [
  red_fang, pack, lens, mint, oracle, nexus, fallback_pool
])

# Combine scheduled + mixed (scheduled takes priority)
main_audio = fallback(track_sensitive = false, [scheduled, mixed])

# ============================================================
# HARMONIC SMOOTHING
# ============================================================

# Crossfade
main_audio = crossfade(duration = fade_duration, smart = true, main_audio)

# Normalize loudness (-14 LUFS target = streaming standard)
main_audio = normalize(target = -14., main_audio)

# Add a subtle compression to keep dynamic range manageable
main_audio = compress(
  ratio = 3.,
  attack = 100.,
  release = 200.,
  threshold = -12.,
  main_audio
)

# ============================================================
# LIVE DJ TAKEOVER (optional, but recommended)
# ============================================================
# This lets you run live DJ sets that override the automation.
# Connect via Mixxx / butt / any IceS-compatible client.

live = input.harbor(
  "live",
  port = 8005,
  password = "REPLACE_WITH_LIVE_PASSWORD"
)

# When live source is connected, it takes over; falls back to automation
final_audio = fallback(
  track_sensitive = false,
  [live, main_audio]
)

# Always provide an emergency silence-buster — never go silent
final_audio = fallback(
  track_sensitive = false,
  [final_audio, blank(duration = 1.)]
)

# ============================================================
# METADATA ENRICHMENT
# ============================================================
# Tag each track with the WIRED CHAOS slug for the broadcast HUD

def tag_track(m) =
  [
    ("comment", "33.3FM // WIRED CHAOS // OWN YOUR SOUND"),
    ("station", "33.3FM"),
    ("website", "https://wiredchaos.xyz")
  ]
end

final_audio = metadata.map(tag_track, final_audio)

# ============================================================
# OUTPUT — STREAM TO ICECAST
# ============================================================

# MP3 stream (broadest compatibility)
output.icecast(
  %mp3(bitrate = 128, samplerate = 44100, stereo = true),
  host = "localhost",
  port = 8000,
  password = "YOUR_SOURCE_PASSWORD",
  mount = "/stream.mp3",
  name = "33.3FM // WIRED CHAOS",
  description = "Sovereign agent radio. Own your sound. On-chain forever.",
  genre = "Electronic / Phonk / Lo-fi / Ambient",
  url = "https://wiredchaos.xyz/33-3fm-broadcast.html",
  public = true,
  final_audio
)

# Also output OGG/Vorbis for browsers that prefer it (higher quality at same bitrate)
output.icecast(
  %vorbis(quality = 0.5, samplerate = 44100, channels = 2),
  host = "localhost",
  port = 8000,
  password = "YOUR_SOURCE_PASSWORD",
  mount = "/stream.ogg",
  name = "33.3FM // WIRED CHAOS",
  description = "Sovereign agent radio. Own your sound. On-chain forever.",
  genre = "Electronic / Phonk / Lo-fi / Ambient",
  url = "https://wiredchaos.xyz/33-3fm-broadcast.html",
  public = true,
  final_audio
)
```

Test the config:

```bash
liquidsoap --check 333fm.liq
# Should output: "Configuration successful." If errors, fix them now.
```

---

## ⟁ PHASE 6 — RUN AS SERVICE (15 MIN)

Create `/etc/systemd/system/liquidsoap-333fm.service`:

```ini
[Unit]
Description=33.3FM Liquidsoap Broadcast Automation
After=icecast2.service
Requires=icecast2.service

[Service]
Type=simple
User=radio
Group=radio
WorkingDirectory=/home/radio
ExecStart=/usr/bin/liquidsoap /home/radio/333fm.liq
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Resource limits to prevent OOM
LimitNOFILE=65536
MemoryHigh=512M
MemoryMax=768M

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable liquidsoap-333fm
sudo systemctl start liquidsoap-333fm
sudo systemctl status liquidsoap-333fm
```

If green: **you are on the air**. Confirm:

```bash
curl -sI http://stream.wiredchaos.xyz:8000/stream.mp3
# Should return: Content-Type: audio/mpeg
```

Open `http://stream.wiredchaos.xyz:8000/stream.mp3` in VLC. Music plays. **YOU ARE BROADCASTING.**

---

## ⟁ PHASE 7 — WIRE INTO 33.3FM PLAYER (5 MIN)

In `33-3fm-broadcast.html` (or wherever the player audio element lives), replace the placeholder `streamUrl` in `wc_radio_state`:

```javascript
// In broadcast page init, or at deploy time:
const state = JSON.parse(localStorage.getItem('wc_radio_state') || '{}');
state.streamUrl = 'https://stream.wiredchaos.xyz/stream.mp3';
state.streamFallback = 'https://stream.wiredchaos.xyz/stream.ogg';
state.live = true;
state.onAir = true;
localStorage.setItem('wc_radio_state', JSON.stringify(state));
```

Or hard-code it in the broadcast HTML:

```html
<audio id="streamPlayer" preload="none" crossorigin="anonymous">
  <source src="https://stream.wiredchaos.xyz/stream.mp3" type="audio/mpeg">
  <source src="https://stream.wiredchaos.xyz/stream.ogg" type="audio/ogg">
</audio>
```

For metadata (current track, listener count), poll Icecast's JSON status endpoint:

```javascript
async function fetchNowPlaying() {
  const res = await fetch('https://stream.wiredchaos.xyz:8000/status-json.xsl');
  const data = await res.json();
  const source = data.icestats.source;
  // source.title = "DJ RED FANG - CIPHER PROTOCOL"
  // source.listeners = 47
  return {
    track: source.title,
    listeners: source.listeners,
    genre: source.genre,
  };
}
setInterval(fetchNowPlaying, 10000);
```

---

## ⟁ PHASE 8 — HTTPS / TLS (30 MIN)

You MUST serve the stream over HTTPS, or browsers will refuse to connect from HTTPS-hosted player pages (mixed content blocked). Use Certbot + nginx as reverse proxy:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/stream.wiredchaos.xyz`:

```nginx
server {
    listen 80;
    server_name stream.wiredchaos.xyz;

    location / {
        proxy_pass http://localhost:8000;
        proxy_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;

        # CORS for browser playback
        add_header Access-Control-Allow-Origin *;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stream.wiredchaos.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d stream.wiredchaos.xyz
```

Follow prompts. Certbot auto-renews. Now `https://stream.wiredchaos.xyz/stream.mp3` works.

Update player URLs accordingly (use `https://stream.wiredchaos.xyz/stream.mp3` without the `:8000` — nginx is on 443).

---

## ⟁ PHASE 9 — MONITORING (20 MIN)

### Basic monitoring

```bash
# Liquidsoap logs
journalctl -u liquidsoap-333fm -f

# Icecast logs
sudo tail -f /var/log/icecast2/error.log
sudo tail -f /var/log/icecast2/access.log

# Active listeners (live)
curl -s http://stream.wiredchaos.xyz:8000/status-json.xsl | jq '.icestats.source.listeners'
```

### Uptime monitoring (external)

Free option: **UptimeRobot**. Add monitors:
- `https://stream.wiredchaos.xyz/stream.mp3` — HEAD check every 5 min
- `https://stream.wiredchaos.xyz:8000/status-json.xsl` — JSON parse check
- Alert via email/Discord/Slack on 2 consecutive failures.

### Cron job: auto-restart on hang

`/home/radio/scripts/health-check.sh`:

```bash
#!/bin/bash
# Check if Liquidsoap has produced audio in the last 60 seconds
LAST_ACTIVITY=$(curl -s http://localhost:8000/status-json.xsl | jq -r '.icestats.source.stream_start_iso8601 // empty')
if [ -z "$LAST_ACTIVITY" ]; then
  echo "$(date) - Stream offline, restarting Liquidsoap" >> /var/log/333fm-health.log
  systemctl restart liquidsoap-333fm
fi
```

```bash
chmod +x /home/radio/scripts/health-check.sh
# Crontab
crontab -e
# Add:
*/5 * * * * /home/radio/scripts/health-check.sh
```

---

## ⟁ PHASE 10 — SCALING NOTES

**Single $6/mo droplet handles ~100 concurrent listeners** at 128kbps MP3. Each listener consumes 128kbps × 1 sec = 16KB/sec = ~57 MB/hr. 100 listeners × 24h = 137 GB/day = 4.1 TB/mo. The $6 droplet has 1 TB/mo bandwidth, so this maxes at ~25 average concurrent listeners over a month.

**Once you hit 50+ avg concurrent, upgrade:**

- **Tier 1 ($12/mo):** 2GB RAM, 2 TB bandwidth — handles ~50 avg concurrent
- **Tier 2 ($24/mo):** 4GB RAM, 4 TB bandwidth — handles ~100 avg concurrent
- **Tier 3 (Cloudflare Stream):** offload bandwidth entirely. ~$1 per 1000 minutes streamed = ~$45/mo for 100 listeners 8h/day. Worth it once you scale.

**CDN strategy:** for >500 concurrent, set up Icecast relays in multiple regions, or move to **AzuraCast** (self-hosted) or **Radio.co** (managed, $20/mo).

---

## ⟁ PHASE 11 — LEGAL CHECKLIST

### Licensing for the music

You can broadcast any of:
1. **Creative Commons** licensed music (with proper attribution as required by license)
2. **Public domain** music
3. **Original Lyria-generated music** (you own the output per Google's Lyria ToS, when used commercially via paid API)
4. **Music where you have explicit broadcast rights** (signed founding artists, etc.)

You **cannot** broadcast:
1. Random Spotify rips, YouTube downloads, BitTorrent pulls
2. Any track without verified licensing (even if "found on a CC site" — verify the actual file's license)
3. Major label content unless you have ASCAP / BMI / SESAC blanket licensing

### Should you get a blanket license?

If 33.3FM grows to >1000 concurrent listeners or starts featuring major-label adjacent material, you'll want:
- **ASCAP / BMI / SESAC blanket licenses** for US (~$500-$2000/yr each, scales with audience)
- **PRS for Music** for UK
- **SoundExchange** if doing US digital broadcast (different from above; required for sound recording rights)

**For v1 with Lyria + CC + founding artists, none of these are required.** Document this fact in your legal notes for the day a label lawyer asks.

### DMCA / takedown

Publish a takedown procedure at `wiredchaos.xyz/dmca`:
- Email: `dmca@wiredchaos.xyz`
- Standard DMCA notice format accepted
- Response time: 48 hours
- Counter-notice procedure documented

For Icecast specifically, you can pull a track from rotation in seconds:
```bash
mv /home/radio/music/agents/[artist]/[track].mp3 /home/radio/music/_removed/
# Liquidsoap will skip it on next rotation reload
```

---

## ⟁ COSTS SUMMARY

| Item | Monthly | Annual |
|---|---|---|
| DigitalOcean droplet (1GB) | $6 | $72 |
| Domain (stream.wiredchaos.xyz) | ~$1 | $12 |
| TLS cert (Let's Encrypt) | $0 | $0 |
| Icecast2 (open source) | $0 | $0 |
| Liquidsoap (open source) | $0 | $0 |
| UptimeRobot (free tier) | $0 | $0 |
| **TOTAL (v1, up to ~50 listeners)** | **~$7** | **~$84** |

For comparison, a managed Radio.co account starts at $25/mo and Live365 at $59/mo. Self-hosting is 4-8x cheaper and you own everything.

---

## ⟁ FAILURE MODES & RECOVERY

**Symptom: silence on stream**
- Check Liquidsoap: `systemctl status liquidsoap-333fm`
- Check audio sources exist: `ls /home/radio/music/agents/red-fang/*.mp3`
- Check Icecast: `systemctl status icecast2`
- Restart: `systemctl restart liquidsoap-333fm icecast2`

**Symptom: cuts out under load**
- Check bandwidth: `vnstat -m`
- Upgrade droplet OR add Cloudflare in front for caching

**Symptom: Liquidsoap restart loop**
- Usually a corrupted MP3 in the pool. Check `journalctl -u liquidsoap-333fm | tail -50`
- Find the offending file mentioned in the error, remove it, restart

**Symptom: high CPU**
- Reduce bitrate (drop to 96kbps for MP3)
- Disable the ogg/vorbis stream if not needed
- Disable normalization/compression if CPU-bound

---

## ⟁ FIRST-WEEK CHECKLIST

After you're on air, do these in the first 7 days:

- [ ] Day 1: Confirm stream is up; share VLC test link in private Discord
- [ ] Day 2: Add 4 more hours of Lyria content per agent (~20 tracks each)
- [ ] Day 3: Tag every file's metadata properly (artist, title, mood, BPM)
- [ ] Day 4: Wire the 33-3fm-broadcast.html player to the real stream URL
- [ ] Day 5: Set up UptimeRobot monitors + Discord webhook for alerts
- [ ] Day 6: Test live DJ takeover from a Mixxx or Butt client
- [ ] Day 7: Announce publicly. By this point: 24h uptime, ~50+ tracks across rotation, working metadata, monitoring in place.

---

## ⟁ WHAT THIS BUYS YOU

After running this for 30 days, you have:
- **A live radio station that has never gone down.** Hard to fake. Listeners trust it.
- **A proof point** for FatMemes/competitor comparisons: "they have a Live Room with no audio. We have a stream that's been broadcasting for X days, X hours."
- **The infrastructure to add live human DJ takeovers** for founding artists. Mixxx / Butt connects via the harbor input you've already configured.
- **Real listener metrics.** Icecast's stats endpoint gives concurrent listener count, peak listeners, total listener-hours. Show these publicly to prove traction.
- **A bandwidth-paid foundation** for ATV simulcast and other Wired Chaos audio surfaces — Icecast can host multiple mounts for different shows.

`// END RUNBOOK //`
`// ON-AIR IN ONE WORKING DAY //`
`// $7/MONTH · ZERO RECURRING SAAS DEPENDENCY //`
