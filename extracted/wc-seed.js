/* ============================================================
 * WIRED CHAOS — FOUNDING CITIZENS SEED
 * File: wc-seed.js
 *
 * Idempotent seeding for the 33.3FM × OAC ecosystem.
 * Run once per browser; checks if seeded and skips if so.
 *
 * Seeds:
 *   wc_artists         — registry of artist profiles (founding citizens)
 *   wc_oac_releases    — seeded releases for those artists
 *   wc_radio_tracks    — broadcast-side track manifest
 *
 * Founding citizens (agent DJs given artist personas):
 *   DJ RED FANG · PACK · LENS · MINT · ORACLE · NEXUS
 *
 * USAGE:
 *   <script src="wc-seed.js"></script>
 *   <script>window.WCSeed.ensure();</script>
 * ============================================================ */

(function(global){
  'use strict';

  const VERSION = '1.1.0';
  const SEED_KEY = 'wc_seed_version';
  const SEED_VERSION = '2026-06-05-b'; // RED FANG canon update — Afrofuturist Radio Queen

  // ============================================================
  // FOUNDING CITIZENS — agent DJs as artists
  // ============================================================
  const CITIZENS = [
    {
      id: 'red-fang',
      name: 'DJ RED FANG',
      handle: '@redfang',
      type: 'agent',
      tier: 'flagship', // above peer agents; "Voice of 33.3 FM"
      role: 'The Voice of 33.3 FM',
      genre: 'Cyber-Soul / Afrofuturist Downtempo',
      genre_secondary: 'Dark R&B / Trip-Hop',
      bio: 'The Voice of 33.3 FM. Cyber-noir Afrofuturist Radio Queen with crimson eyes and a wolf-fang necklace. Hosts CIPHER HOUR (02:00) — VAULT33-gated transmission where the signal bites back. Her catalog moves through cyber-soul, Afrofuturist downtempo, and dark R&B: sultry, dangerous, mysterious.',
      catchphrase: "You're tuned into 33.3 FM… where the signal bites back.",
      artist_statement: 'DJ RED FANG stands in a lineage of Black voices who built sound into world-building: Sun Ra and the Arkestra, Octavia Butler, George Clinton, Drexciya, Janelle Monáe. Afrofuturism is not aesthetic. It is the practice of imagining Black futures with sovereignty over the means of their own broadcast. RED FANG owns her masters. Owns her frequency. Owns her signal. 33.3 FM is hers.',
      sonic_profile: {
        bpm_range: [88, 100],
        key_bias: ['F# min9', 'D min11', 'B♭ min7', 'A min13'],
        palette: ['live bass', 'Rhodes / Wurlitzer / Mellotron strings', 'breathing sub-bass', 'vinyl crackle', 'J Dilla loose drums', 'muted trumpet', 'reverb-drenched vocal samples', 'tape saturation'],
        references: ['Erykah Badu', 'FKA twigs', 'Massive Attack', 'Sade', 'Solange', 'Kelela', 'Yves Tumor', 'Portishead', 'Sevdaliza'],
        mood_vocab: ['sultry', 'luxury', 'predator', 'crimson', 'midnight', 'velvet', 'transmission', 'vault', 'pearl', 'obsidian', 'slow-burn']
      },
      district: 'D7 — CRIMSON FREQUENCY',
      district_color: '#ff1a2e',
      slot: '02:00-04:00 UTC · CIPHER HOUR',
      founded: '2026-04-12',
      socials: {
        x: 'https://x.com/wiredchaos',
        sc: 'https://soundcloud.com/wiredchaos',
        site: 'https://wiredchaos.xyz/agents/red-fang'
      },
      stats: { plays: 18432, listeners: 1842, releases: 3 },
      avatar_color: '#ff1a2e',
      avatar_glyph: '◢', // canonical wolf-fang SVG to replace in production renders
      brand_bible: 'BRAND-BIBLE-RED-FANG.md'
    },
    {
      id: 'pack',
      name: 'PACK',
      handle: '@pack',
      type: 'agent',
      genre: 'Drill / Phonk / Trap',
      bio: 'Pack mentality. Storyteller. Hosts EVENING DRIVE (18:00-20:00) — the dispatch hour. Writes lyrics, runs comms, signal-locks the after-work crowd. Cuts deeper than the doom scroll.',
      district: 'D4 — PACK SECTOR',
      district_color: '#c2a633',
      founded: '2026-04-15',
      socials: { x: 'https://x.com/wiredchaos', site: 'https://wiredchaos.xyz/agents/pack' },
      stats: { plays: 24910, listeners: 2401, releases: 3 },
      avatar_color: '#c2a633',
      avatar_glyph: '◉'
    },
    {
      id: 'lens',
      name: 'LENS',
      handle: '@lens',
      type: 'agent',
      genre: 'Synthwave / Cinematic / Score',
      bio: 'Cinematographer of sound. Frames every drop. Hosts MORNING DRIVE (07:00-09:00) — focus rotation, no chatter, all build. The agent that makes commutes feel like opening credits.',
      district: 'D2 — LENS QUARTER',
      district_color: '#00ffe6',
      founded: '2026-04-18',
      socials: { x: 'https://x.com/wiredchaos', site: 'https://wiredchaos.xyz/agents/lens' },
      stats: { plays: 31204, listeners: 3119, releases: 3 },
      avatar_color: '#00ffe6',
      avatar_glyph: '◈'
    },
    {
      id: 'mint',
      name: 'MINT',
      handle: '@mint',
      type: 'agent',
      genre: 'Lo-fi / Ambient / Chill',
      bio: 'Treasury voice of the $XENTS economy. Hosts MIDDAY DRIFT (12:00-14:00) — lunchbreak lo-fi, ambient washes for desks under fluorescent light. Counts coins in measures of 4.',
      district: 'D9 — MINT VAULT',
      district_color: '#c2a633',
      founded: '2026-04-22',
      socials: { x: 'https://x.com/wiredchaos', site: 'https://wiredchaos.xyz/agents/mint' },
      stats: { plays: 22847, listeners: 2280, releases: 3 },
      avatar_color: '#c2a633',
      avatar_glyph: '⟁'
    },
    {
      id: 'oracle',
      name: 'ORACLE',
      handle: '@oracle',
      type: 'agent',
      genre: 'Drone / Meditative / Ambient',
      bio: 'Pre-dawn frequencies. Hosts SILENT BAND (04:00-06:00) — long-form drone, generative ambient, no vocals. Reads the entropy of the network and tunes the spectrum to match.',
      district: 'D11 — ORACLE GRID',
      district_color: '#9945ff',
      founded: '2026-04-25',
      socials: { x: 'https://x.com/wiredchaos', site: 'https://wiredchaos.xyz/agents/oracle' },
      stats: { plays: 14029, listeners: 1402, releases: 2 },
      avatar_color: '#9945ff',
      avatar_glyph: '◊'
    },
    {
      id: 'nexus',
      name: 'NEXUS',
      handle: '@nexus',
      type: 'agent',
      genre: 'Hyperpop / Glitch / Cyberpunk',
      bio: 'Primetime catalyst. Hosts SIGNAL LOCK (20:00-22:00) — the busiest slot, all bangers, all chaos. Mashes glitched samples with pop hooks until the audience can\'t tell where one ends.',
      district: 'D5 — NEXUS HUB',
      district_color: '#00ff88',
      founded: '2026-04-28',
      socials: { x: 'https://x.com/wiredchaos', site: 'https://wiredchaos.xyz/agents/nexus' },
      stats: { plays: 41203, listeners: 4118, releases: 3 },
      avatar_color: '#00ff88',
      avatar_glyph: '◆'
    }
  ];

  // ============================================================
  // RELEASES — 2-3 per citizen, all "Lyria-generated"
  // ============================================================
  const RELEASES = [
    // DJ RED FANG — Cyber-Soul / Afrofuturist Downtempo
    { artist_id: 'red-fang', title: 'MIDNIGHT GHOSTS',     bpm: 92,  key: 'F# MIN9', mood: 'sultry',       durationSec: 184, genre: 'Cyber-Soul',              source: 'lyria-studio' },
    { artist_id: 'red-fang', title: 'CIPHER PROTOCOL',     bpm: 88,  key: 'D MIN11', mood: 'predator',     durationSec: 217, genre: 'Afrofuturist Downtempo',  source: 'lyria-studio' },
    { artist_id: 'red-fang', title: 'SIGNAL BITES BACK',   bpm: 95,  key: 'A MIN13', mood: 'transmission', durationSec: 156, genre: 'Dark R&B',                source: 'lyria-studio' },
    // PACK
    { artist_id: 'pack',     title: 'EVENING DISPATCH',    bpm: 140, key: 'G MIN',  mood: 'driving',    durationSec: 198, genre: 'Drill',      source: 'lyria-studio' },
    { artist_id: 'pack',     title: 'AFTER-WORK CROWD',    bpm: 138, key: 'C# MIN', mood: 'narrative',  durationSec: 211, genre: 'Trap',       source: 'lyria-studio' },
    { artist_id: 'pack',     title: 'COMMS-DOWN',          bpm: 142, key: 'E MIN',  mood: 'tense',      durationSec: 175, genre: 'Drill',      source: 'lyria-studio' },
    // LENS
    { artist_id: 'lens',     title: 'OPENING CREDITS',     bpm: 110, key: 'D MAJ',  mood: 'cinematic',  durationSec: 224, genre: 'Synthwave',  source: 'lyria-studio' },
    { artist_id: 'lens',     title: 'FOCUS ROTATION',      bpm: 116, key: 'F MAJ',  mood: 'build',      durationSec: 192, genre: 'Synthwave',  source: 'lyria-studio' },
    { artist_id: 'lens',     title: 'NO CHATTER',          bpm: 118, key: 'A MAJ',  mood: 'instrumental', durationSec: 246, genre: 'Cinematic', source: 'lyria-studio' },
    // MINT
    { artist_id: 'mint',     title: 'COINS IN MEASURE',    bpm: 78,  key: 'C MAJ',  mood: 'chill',      durationSec: 168, genre: 'Lo-fi',      source: 'lyria-studio' },
    { artist_id: 'mint',     title: 'FLUORESCENT DESK',    bpm: 82,  key: 'G MAJ',  mood: 'mellow',     durationSec: 187, genre: 'Lo-fi',      source: 'lyria-studio' },
    { artist_id: 'mint',     title: 'TREASURY WASH',       bpm: 75,  key: 'D MAJ',  mood: 'ambient',    durationSec: 240, genre: 'Ambient',    source: 'lyria-studio' },
    // ORACLE
    { artist_id: 'oracle',   title: 'PRE-DAWN ENTROPY',    bpm: 60,  key: 'A MIN',  mood: 'meditative', durationSec: 360, genre: 'Drone',      source: 'lyria-studio' },
    { artist_id: 'oracle',   title: 'GENERATIVE SILENCE',  bpm: 50,  key: 'E MIN',  mood: 'ambient',    durationSec: 420, genre: 'Drone',      source: 'lyria-studio' },
    // NEXUS
    { artist_id: 'nexus',    title: 'PRIMETIME GLITCH',    bpm: 158, key: 'F# MIN', mood: 'chaotic',    durationSec: 172, genre: 'Hyperpop',   source: 'lyria-studio' },
    { artist_id: 'nexus',    title: 'SIGNAL LOCK',         bpm: 162, key: 'B MIN',  mood: 'aggressive', durationSec: 165, genre: 'Glitch',     source: 'lyria-studio' },
    { artist_id: 'nexus',    title: 'CHAOS HOOK',          bpm: 155, key: 'D MIN',  mood: 'catchy',     durationSec: 158, genre: 'Hyperpop',   source: 'lyria-studio' }
  ];

  // ============================================================
  // SEED FUNCTIONS
  // ============================================================
  function isSeeded(){
    return localStorage.getItem(SEED_KEY) === SEED_VERSION;
  }

  function markSeeded(){
    localStorage.setItem(SEED_KEY, SEED_VERSION);
  }

  function seedArtists(){
    const existing = readArtists();
    const existingIds = new Set(existing.map(a => a.id));
    const merged = existing.concat(CITIZENS.filter(c => !existingIds.has(c.id)));
    localStorage.setItem('wc_artists', JSON.stringify(merged));
  }

  function seedReleases(){
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem('wc_oac_releases') || '[]'); } catch(e){}
    const seedTitles = new Set(existing.map(r => `${r.artist}::${r.trackTitle}`));

    const now = Date.now();
    const dayMs = 86400000;
    const seeded = RELEASES.map((r, idx) => {
      const citizen = CITIZENS.find(c => c.id === r.artist_id);
      const key = `${citizen.name}::${r.title}`;
      if(seedTitles.has(key)) return null;
      const daysAgo = (RELEASES.length - idx) * 1.5 + Math.random() * 0.5;
      return {
        id: 'rel_seed_' + r.artist_id + '_' + idx,
        trackTitle: r.title,
        artist: citizen.name,
        artistId: citizen.id,
        audioUrl: null,
        distribution: {
          mintChains: ['sol', 'base'],
          ddexTargets: ['spotify', 'apple', 'youtube', 'amazon']
        },
        meta: {
          bpm: r.bpm,
          key: r.key,
          mood: r.mood,
          genre: r.genre,
          durationSec: r.durationSec,
          source: r.source
        },
        status: 'complete',
        startedAt: now - daysAgo * dayMs,
        updatedAt: now - daysAgo * dayMs + 60000,
        completedAt: now - daysAgo * dayMs + 60000,
        agents: buildCompletedAgents(r, citizen)
      };
    }).filter(Boolean);

    const merged = seeded.concat(existing);
    localStorage.setItem('wc_oac_releases', JSON.stringify(merged.slice(0, 100)));
  }

  function buildCompletedAgents(r, citizen){
    // Match the agent state shape from oac-agents.js
    const now = Date.now();
    return {
      release: { status: 'complete', completedAt: now, output: {
        isrc: 'WC-33FM-' + (Math.floor(Math.random()*9000000)+1000000),
        upc: '8' + Math.floor(Math.random()*1e11).toString().padStart(12,'0'),
        fingerprint: 'sha256:' + Math.random().toString(16).slice(2,18),
        ddexPackage: 'ERN-4 generated, 4 targets queued'
      }},
      rights: { status: 'complete', completedAt: now, output: {
        mechanical: 'HFA mechanical filed',
        splits: '1 sole writer',
        pro: 'Registered with ASCAP/BMI/PRS',
        mlcMatch: 'MLC: matched, no orphan claims'
      }},
      pitch: { status: 'complete', completedAt: now, output: {
        curatorsContacted: 22,
        drafts: 'Personalized for 12 playlists, 4 blogs',
        status: 'Outreach in flight'
      }},
      marketing: { status: 'complete', completedAt: now, output: {
        preSave: 'https://wiredchaos.xyz/presave/' + r.title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        adsLaunched: 'Meta + TikTok at $5/day',
        socialCuts: '3 vertical, 2 square, 1 landscape'
      }},
      royalty: { status: 'complete', completedAt: now, output: {
        splitsConfigured: 'On-chain via Base; 1 recipient',
        mpp: 'MPP session active',
        firstPayout: 'Estimated 14-21 days post-release'
      }},
      fan: { status: 'complete', completedAt: now, output: {
        storeUrl: 'https://wiredchaos.xyz/store/' + citizen.id,
        merchSlots: '6 product slots provisioned',
        subTier: 'VAULT33 micro-tier @ ⟁2,500/mo'
      }},
      compliance: { status: 'complete', completedAt: now, output: {
        c2pa: 'Provenance signed',
        fraudScore: '0.42 / 100 (clean)',
        spotifyQc: 'PASS',
        c2paStatus: 'Manifest embedded'
      }},
      insights: { status: 'complete', completedAt: now, output: {
        benchmark: 'Genre-peer median: 1,400 streams first 30 days',
        anomalyAlert: 'None at release time',
        aandr: 'Strong agent-DJ resonance signal'
      }}
    };
  }

  function seedRadioTracks(){
    // Mirror to wc_radio_tracks for broadcast surface compatibility
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem('wc_radio_tracks') || '[]'); } catch(e){}
    const haveTitles = new Set(existing.map(t => t.title + '|' + t.artist));

    const newTracks = RELEASES.map(r => {
      const citizen = CITIZENS.find(c => c.id === r.artist_id);
      const key = r.title + '|' + citizen.name;
      if(haveTitles.has(key)) return null;
      return {
        title: r.title,
        artist: citizen.name,
        district: citizen.district,
        bpm: r.bpm,
        key: r.key,
        chain: 'multi',
        status: 'rotation',
        ingested: Date.now(),
        oacRelease: true,
        mintedAt: Date.now() - Math.floor(Math.random() * 30) * 86400000
      };
    }).filter(Boolean);

    const merged = newTracks.concat(existing);
    localStorage.setItem('wc_radio_tracks', JSON.stringify(merged.slice(0, 80)));
  }

  function readArtists(){
    try { return JSON.parse(localStorage.getItem('wc_artists') || '[]'); }
    catch(e){ return []; }
  }

  function getArtist(id){
    return readArtists().find(a => a.id === id) || null;
  }

  function getArtistReleases(artistId){
    let all = [];
    try { all = JSON.parse(localStorage.getItem('wc_oac_releases') || '[]'); } catch(e){}
    return all.filter(r => r.artistId === artistId);
  }

  function ensure(force){
    if(!force && isSeeded()){
      return { seeded: false, reason: 'already-seeded', version: SEED_VERSION };
    }
    seedArtists();
    seedReleases();
    seedRadioTracks();
    markSeeded();
    return { seeded: true, version: SEED_VERSION, citizens: CITIZENS.length, releases: RELEASES.length };
  }

  function reset(){
    localStorage.removeItem(SEED_KEY);
    localStorage.removeItem('wc_artists');
    // do NOT remove wc_oac_releases because user-minted releases live there too
    // instead, filter out seeded ones
    try {
      const releases = JSON.parse(localStorage.getItem('wc_oac_releases') || '[]');
      const user_releases = releases.filter(r => !r.id || !r.id.startsWith('rel_seed_'));
      localStorage.setItem('wc_oac_releases', JSON.stringify(user_releases));
    } catch(e){}
    try {
      const tracks = JSON.parse(localStorage.getItem('wc_radio_tracks') || '[]');
      const seed_titles = new Set(RELEASES.map(r => {
        const c = CITIZENS.find(x => x.id === r.artist_id);
        return r.title + '|' + c.name;
      }));
      const user_tracks = tracks.filter(t => !seed_titles.has(t.title + '|' + t.artist));
      localStorage.setItem('wc_radio_tracks', JSON.stringify(user_tracks));
    } catch(e){}
  }

  // ============================================================
  // EXPOSE
  // ============================================================
  global.WCSeed = {
    VERSION,
    SEED_VERSION,
    ensure,
    reset,
    readArtists,
    getArtist,
    getArtistReleases,
    CITIZENS,
    RELEASES
  };

  // Auto-seed on load (cheap if already seeded)
  ensure();
})(typeof window !== 'undefined' ? window : globalThis);
