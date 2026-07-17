/* ============================================================
 * OAC AGENTS — release-side roster for 33.3FM × OAC
 * File: oac-agents.js
 *
 * Per architecture decision: these 8 agents ride ALONGSIDE the
 * DJ roster (DJ RED FANG, PACK, LENS, MINT, ORACLE, NEXUS), not
 * merged. DJ roster owns broadcast-side; OAC roster owns
 * release-side. Two separate rosters, one shared registry.
 *
 * USAGE:
 *   <script src="oac-agents.js"></script>
 *   <script>
 *     const release = window.OAC.startRelease({
 *       trackTitle: 'Midnight Ghosts',
 *       artist: 'XENT-K0RE',
 *       audioUrl: '...',
 *       distribution: { mintChains:['sol','base'], ddexTargets:['spotify','apple'] }
 *     });
 *     // Subscribe to pipeline state
 *     window.OAC.onRelease(release.id, state => render(state));
 *   </script>
 *
 * Pipeline is modeled as a DAG. Agents fire in dependency order.
 * State persists to localStorage["wc_oac_releases"].
 * ============================================================ */

(function(global){
  'use strict';

  const VERSION = '1.0.0';
  const STORE_KEY = 'wc_oac_releases';

  // ---------- AGENT DEFINITIONS ----------
  const AGENTS = {
    release: {
      id: 'release',
      name: 'RELEASE AGENT',
      glyph: '◢',
      color: '#00ffe6',
      persona: 'methodical, audio-engineering precision, ingest + fingerprint specialist',
      role: 'Ingest audio, generate metadata, ISRC/UPC, artwork QC, schedule drop',
      tools: 'DDEX delivery, MCP tools for stores, audio fingerprint, mood/genre/BPM detection',
      durationSec: 18,
      depends: []
    },
    rights: {
      id: 'rights',
      name: 'RIGHTS AGENT',
      glyph: '⟁',
      color: '#c2a633',
      persona: 'paralegal sharpness, splits-and-licenses fluent, MLC/HFA-native',
      role: 'File splits, cover licensing, sync registrations, PRO/MLC matching',
      tools: 'AP2 mandates for collaborators, HFA/MLC APIs, sync supervisor outreach',
      durationSec: 22,
      depends: ['release']
    },
    pitch: {
      id: 'pitch',
      name: 'PITCH AGENT',
      glyph: '◈',
      color: '#9945ff',
      persona: 'A&R-style, curator-fluent, knows blog editors by first name',
      role: 'Find playlist curators, blogs, sync supervisors; draft + send pitches',
      tools: 'Web search, email, CRM, embeddings on curator history',
      durationSec: 28,
      depends: ['release', 'rights']
    },
    marketing: {
      id: 'marketing',
      name: 'MARKETING AGENT',
      glyph: '▣',
      color: '#ff66cc',
      persona: 'social-cuts-and-ads native, TikTok-pilled, paid-acquisition expert',
      role: 'Pre-save links, ad campaigns, social cuts, email/SMS blasts',
      tools: 'Meta Ads API, TikTok, ESP, video gen',
      durationSec: 24,
      depends: ['release']
    },
    royalty: {
      id: 'royalty',
      name: 'ROYALTY AGENT',
      glyph: '◆',
      color: '#00ff88',
      persona: 'accountant-precise, anomaly-sniffing, real-time reconciler',
      role: 'Reconcile statements, detect underpayments, file claims, push real-time payouts',
      tools: 'MPP sessions, x402 micropayments, bank rails, $XENTS settlement on Base',
      durationSec: 14,
      depends: ['rights']
    },
    fan: {
      id: 'fan',
      name: 'FAN AGENT',
      glyph: '◉',
      color: '#ff1a2e',
      persona: 'community manager warmth, 1:1 DM fluent, upseller without being slimy',
      role: 'Run direct-to-fan store, answer fan DMs, upsell merch, manage subs',
      tools: 'ACP merchant endpoint, Stripe/PayPal, MCP product feed',
      durationSec: 16,
      depends: ['release', 'marketing']
    },
    compliance: {
      id: 'compliance',
      name: 'COMPLIANCE AGENT',
      glyph: '▤',
      color: '#0052ff',
      persona: 'paranoid auditor energy, fraud-pattern hunter, C2PA-signing zealot',
      role: 'Fraud/streaming-farm detection, C2PA provenance, KYC, takedown defense',
      tools: 'C2PA SDK, audio similarity, identity verification, Spotify QC pre-check',
      durationSec: 20,
      depends: ['release']
    },
    insights: {
      id: 'insights',
      name: 'INSIGHTS AGENT',
      glyph: '◊',
      color: '#76b900',
      persona: 'data-poet, finds the story in the streaming patterns, A&R-grade pattern reader',
      role: 'Daily analytics, anomaly alerts, A&R-style recommendations',
      tools: 'ClickHouse, store APIs, LLM analysis',
      durationSec: 12,
      depends: ['royalty', 'fan']
    }
  };

  // Order of display in roster UIs
  const ORDER = ['release','rights','pitch','marketing','royalty','fan','compliance','insights'];

  // Status enum
  const STATUS = {
    PENDING:    'pending',
    QUEUED:     'queued',
    RUNNING:    'running',
    COMPLETE:   'complete',
    FAILED:     'failed',
    BLOCKED:    'blocked'
  };

  // ---------- STATE ----------
  const subscribers = {}; // releaseId -> [fn,fn,...]

  function loadReleases(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveReleases(arr){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0,50))); } catch(e){}
  }
  function getRelease(id){
    return loadReleases().find(r => r.id === id) || null;
  }
  function updateRelease(id, patch){
    const all = loadReleases();
    const idx = all.findIndex(r => r.id === id);
    if(idx < 0) return null;
    all[idx] = Object.assign({}, all[idx], patch, { updatedAt: Date.now() });
    saveReleases(all);
    notify(id, all[idx]);
    return all[idx];
  }
  function updateAgentState(releaseId, agentId, patch){
    const all = loadReleases();
    const idx = all.findIndex(r => r.id === releaseId);
    if(idx < 0) return null;
    if(!all[idx].agents) all[idx].agents = {};
    all[idx].agents[agentId] = Object.assign({}, all[idx].agents[agentId] || {}, patch);
    all[idx].updatedAt = Date.now();
    saveReleases(all);
    notify(releaseId, all[idx]);
    return all[idx];
  }
  function notify(releaseId, state){
    (subscribers[releaseId] || []).forEach(fn => {
      try { fn(state); } catch(e){}
    });
    // GTM event
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({
      event: 'oac_release_update',
      releaseId, status: state.status
    });
  }

  // ---------- PIPELINE SCHEDULER ----------
  function ready(release, agentId){
    const agent = AGENTS[agentId];
    if(!agent) return false;
    if(!release.agents) release.agents = {};
    const me = release.agents[agentId] || { status: STATUS.PENDING };
    if(me.status !== STATUS.PENDING) return false;
    return agent.depends.every(d => {
      const dep = release.agents[d];
      return dep && dep.status === STATUS.COMPLETE;
    });
  }

  function runAgent(releaseId, agentId){
    const agent = AGENTS[agentId];
    if(!agent) return;

    // Mark queued
    updateAgentState(releaseId, agentId, { status: STATUS.QUEUED, startedAt: Date.now() });

    // Small queue delay (visual)
    setTimeout(() => {
      updateAgentState(releaseId, agentId, { status: STATUS.RUNNING, runningAt: Date.now() });

      // Simulated work — in production each agent makes real tool calls
      const workTime = (agent.durationSec * 1000) * (0.6 + Math.random() * 0.4);

      setTimeout(() => {
        // Generate simulated output per agent
        const output = generateOutput(agentId, releaseId);
        updateAgentState(releaseId, agentId, {
          status: STATUS.COMPLETE,
          completedAt: Date.now(),
          output
        });

        // Check if anything else is now ready
        tick(releaseId);
      }, workTime);
    }, 300 + Math.random() * 400);
  }

  function tick(releaseId){
    const r = getRelease(releaseId);
    if(!r) return;
    ORDER.forEach(agentId => {
      if(ready(r, agentId)) runAgent(releaseId, agentId);
    });

    // Mark release complete if all agents done
    const allDone = ORDER.every(a => r.agents && r.agents[a] && r.agents[a].status === STATUS.COMPLETE);
    if(allDone && r.status !== 'complete'){
      updateRelease(releaseId, { status: 'complete', completedAt: Date.now() });
    }
  }

  // ---------- OUTPUTS (simulated per-agent results) ----------
  function generateOutput(agentId, releaseId){
    const r = getRelease(releaseId);
    const title = r?.trackTitle || 'UNTITLED';
    const artist = r?.artist || 'UNKNOWN';

    switch(agentId){
      case 'release':
        return {
          isrc: 'WC-33FM-' + Date.now().toString().slice(-7),
          upc: '8' + Math.floor(Math.random()*1e11).toString().padStart(12,'0'),
          fingerprint: 'sha256:' + Math.random().toString(16).slice(2,18),
          ddexPackage: 'ERN-4 generated, ' + (r?.distribution?.ddexTargets?.length || 0) + ' targets queued'
        };
      case 'rights':
        return {
          mechanical: 'HFA mechanical filed',
          splits: r?.splits ? `${r.splits.length} collaborators signed via AP2` : '1 sole writer',
          pro: 'Registered with ASCAP/BMI/PRS',
          mlcMatch: 'MLC: matched, no orphan claims'
        };
      case 'pitch':
        return {
          curatorsContacted: 14 + Math.floor(Math.random()*20),
          drafts: 'Personalized for 12 playlists, 4 blogs, 2 sync supervisors',
          status: 'Awaiting responses (24-72h typical)'
        };
      case 'marketing':
        return {
          preSave: 'https://wiredchaos.xyz/presave/' + slug(title),
          adsLaunched: 'Meta + TikTok at $5/day, geo: US/UK/CA',
          socialCuts: '3 vertical, 2 square, 1 landscape generated'
        };
      case 'royalty':
        return {
          splitsConfigured: 'On-chain via Base; ' + (r?.splits?.length || 1) + ' recipients',
          mpp: 'MPP session active for real-time streaming',
          firstPayout: 'Estimated 14-21 days post-release (Spotify cycle)'
        };
      case 'fan':
        return {
          storeUrl: 'https://wiredchaos.xyz/store/' + slug(artist),
          merchSlots: '6 product slots provisioned, 0 active (artist must enable)',
          subTier: 'VAULT33 micro-tier @ ⟁2,500/mo provisioned'
        };
      case 'compliance':
        return {
          c2pa: 'Provenance signed: ' + new Date().toISOString(),
          fraudScore: (Math.random()*5).toFixed(2) + ' / 100 (clean)',
          spotifyQc: 'PASS — no audio-similarity flags, no velocity anomalies',
          c2paStatus: 'Manifest embedded in audio metadata'
        };
      case 'insights':
        return {
          benchmark: 'Genre-peer median: 1,400 streams in first 30 days',
          anomalyAlert: 'None at release time',
          aandr: 'Track shows phonk x ambient hybrid signal — consider followup with same producer'
        };
      default:
        return { ok: true };
    }
  }

  function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  // ---------- PUBLIC API ----------
  function startRelease(opts){
    if(!opts || !opts.trackTitle){
      console.warn('[OAC] startRelease requires { trackTitle }');
      return null;
    }
    const release = {
      id: 'rel_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7),
      trackTitle: opts.trackTitle,
      artist: opts.artist || 'UNKNOWN',
      audioUrl: opts.audioUrl || null,
      distribution: opts.distribution || { mintChains: ['base'], ddexTargets: [] },
      splits: opts.splits || null,
      status: 'running',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      agents: {}
    };
    // Initialize agent states
    ORDER.forEach(a => {
      release.agents[a] = { status: STATUS.PENDING };
    });
    const all = loadReleases();
    all.unshift(release);
    saveReleases(all);

    // Kick the pipeline
    setTimeout(() => tick(release.id), 50);
    return release;
  }

  function onRelease(releaseId, fn){
    if(typeof fn !== 'function') return;
    if(!subscribers[releaseId]) subscribers[releaseId] = [];
    subscribers[releaseId].push(fn);
    // Fire immediately with current state
    const r = getRelease(releaseId);
    if(r) try { fn(r); } catch(e){}
  }
  function offRelease(releaseId, fn){
    if(!subscribers[releaseId]) return;
    const i = subscribers[releaseId].indexOf(fn);
    if(i >= 0) subscribers[releaseId].splice(i, 1);
  }

  function listReleases(){ return loadReleases(); }

  function progress(releaseId){
    const r = getRelease(releaseId);
    if(!r || !r.agents) return 0;
    const done = ORDER.filter(a => r.agents[a]?.status === STATUS.COMPLETE).length;
    return done / ORDER.length;
  }

  // Cross-tab sync
  global.addEventListener('storage', (e) => {
    if(e.key === STORE_KEY){
      // Notify all subscribers about all known releases
      Object.keys(subscribers).forEach(rid => {
        const r = getRelease(rid);
        if(r) subscribers[rid].forEach(fn => { try { fn(r); } catch(err){} });
      });
    }
  });

  // ---------- EXPOSE ----------
  global.OAC = {
    VERSION,
    AGENTS, ORDER, STATUS,
    startRelease, onRelease, offRelease,
    listReleases, getRelease, progress
  };
})(typeof window !== 'undefined' ? window : globalThis);
