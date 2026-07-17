/* ============================================================
 * 33.3FM × AGENTROPOLIS BRIDGE
 * File: wc-pano-radio-bridge.js
 *
 * Drop-in module for wc-pano-engine.html
 * Adds in-world radio speakers to any of the 14 districts,
 * syncs to live broadcast state from 33.3FM, supports
 * positional audio, and writes back district-aware listener
 * counts to the shared state.
 *
 * USAGE (in wc-pano-engine.html):
 *   <script src="wc-pano-radio-bridge.js"></script>
 *   <script>
 *     const radio = new WCPanoRadio({
 *       scene,                  // your THREE.Scene
 *       camera,                 // your THREE.PerspectiveCamera
 *       district: 'VOID-7',     // current district id
 *       listener: audioListener // optional THREE.AudioListener
 *     });
 *     radio.mount();            // adds speakers + HUD
 *     // in your render loop:
 *     radio.update(deltaTime);
 *   </script>
 *
 * SHARED STATE KEYS:
 *   wc_radio_state       (read)  — live broadcast snapshot
 *   wc_radio_schedule    (read)  — programming grid
 *   wc_radio_listeners   (write) — per-district counts
 *   agentropolis_citizens(read)  — citizen registry
 *   cbe_state            (write) — citizen broadcast events
 *
 * GTM dataLayer events:
 *   wc_pano_radio_mount, wc_pano_radio_track_change,
 *   wc_pano_radio_district_takeover
 * ============================================================ */

(function(global){
  'use strict';

  const VERSION = '1.0.0';
  const STATE_KEY     = 'wc_radio_state';
  const SCHED_KEY     = 'wc_radio_schedule';
  const LISTEN_KEY    = 'wc_radio_listeners';
  const CITIZEN_KEY   = 'agentropolis_citizens';
  const CBE_KEY       = 'cbe_state';

  // 14 districts with default speaker placement coordinates
  // (can be overridden per district by passing `speakerPositions`)
  const DISTRICT_DEFAULTS = {
    'MADISON':       { color: 0xff1a2e, theme: 'agency-noir' },
    'VOID-7':        { color: 0x00ffe6, theme: 'industrial-void' },
    'XENTS':         { color: 0xc2a633, theme: 'change-machine' },
    'VAULT33':       { color: 0xff1a2e, theme: 'gated-premium' },
    'PACK-DEN':      { color: 0x00ff88, theme: 'community' },
    'CHRYSANTHEUM':  { color: 0xff66cc, theme: 'floral-cyber' },
    'GRIND3R':       { color: 0xc2a633, theme: 'syndicate' },
    'NTKY2090':      { color: 0x9945ff, theme: 'future-citizen' },
    'SUIT54':        { color: 0xffffff, theme: 'sovereign-suit' },
    'TERRA':         { color: 0x00ff88, theme: 'off-grid' },
    'BSA-OPS':       { color: 0x76b900, theme: 'covert-ops' },
    'ENTERTAINMENT': { color: 0xff2d78, theme: 'studio-row' },
    'SENTINEL':      { color: 0x00e5ff, theme: 'patrol' },
    'ATV-CORE':      { color: 0xb44fff, theme: 'broadcast-core' }
  };

  function lsGet(k, fallback){
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch(e){ return fallback; }
  }
  function lsSet(k, v){
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){}
  }
  function dl(event, payload){
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push(Object.assign({event}, payload || {}));
  }

  class WCPanoRadio {
    constructor(opts = {}){
      this.scene    = opts.scene;
      this.camera   = opts.camera;
      this.listener = opts.listener || null;
      this.district = opts.district || 'VOID-7';
      this.speakerPositions = opts.speakerPositions || [
        [ 6, 1.5,  0],
        [-6, 1.5,  0],
        [ 0, 1.5,  6],
        [ 0, 1.5, -6]
      ];
      this.theme = DISTRICT_DEFAULTS[this.district] || DISTRICT_DEFAULTS['VOID-7'];

      this._speakers      = [];
      this._audio         = null;
      this._lastTrackId   = null;
      this._mounted       = false;
      this._hud           = null;
      this._tickAccum     = 0;

      // require THREE if using mount()
      this.THREE = global.THREE || null;
    }

    mount(){
      if(this._mounted) return;
      if(!this.THREE){ console.warn('[WCPanoRadio] THREE.js not found on global'); return; }
      if(!this.scene)  { console.warn('[WCPanoRadio] scene required for mount()'); return; }

      this._buildSpeakers();
      this._buildHUD();
      this._wireAudio();
      this._registerListener();
      this._mounted = true;

      dl('wc_pano_radio_mount', {
        district: this.district,
        version: VERSION,
        speakers: this._speakers.length
      });
    }

    /* ---------- 3D speaker meshes ---------- */
    _buildSpeakers(){
      const T = this.THREE;
      const mat = new T.MeshStandardMaterial({
        color: this.theme.color,
        emissive: this.theme.color,
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.3
      });
      const geo = new T.BoxGeometry(0.8, 1.6, 0.6);

      this.speakerPositions.forEach((p, i) => {
        const mesh = new T.Mesh(geo, mat.clone());
        mesh.position.set(p[0], p[1], p[2]);
        mesh.userData.isWCSpeaker = true;
        mesh.userData.speakerIndex = i;

        // Pulse halo
        const halo = new T.Mesh(
          new T.RingGeometry(0.9, 1.0, 32),
          new T.MeshBasicMaterial({
            color: this.theme.color,
            transparent: true,
            opacity: 0.5,
            side: T.DoubleSide
          })
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = -0.78;
        mesh.add(halo);
        mesh.userData.halo = halo;

        // Front grille indicator
        const grille = new T.Mesh(
          new T.CircleGeometry(0.25, 24),
          new T.MeshBasicMaterial({ color: 0x000000 })
        );
        grille.position.set(0, 0, 0.31);
        mesh.add(grille);

        const grilleGlow = new T.Mesh(
          new T.CircleGeometry(0.18, 24),
          new T.MeshBasicMaterial({
            color: this.theme.color,
            transparent: true,
            opacity: 0.7
          })
        );
        grilleGlow.position.set(0, 0, 0.32);
        mesh.add(grilleGlow);
        mesh.userData.grilleGlow = grilleGlow;

        this.scene.add(mesh);
        this._speakers.push(mesh);
      });
    }

    /* ---------- Positional audio ---------- */
    _wireAudio(){
      const T = this.THREE;
      if(!this.listener && this.camera){
        this.listener = new T.AudioListener();
        this.camera.add(this.listener);
      }
      if(!this.listener) return;

      // Audio is driven by an HTMLAudioElement so it can stream
      // from the 33.3FM broadcast endpoint without preloading.
      const audioEl = document.createElement('audio');
      audioEl.crossOrigin = 'anonymous';
      audioEl.loop = false;
      audioEl.preload = 'none';
      audioEl.id = 'wc-pano-radio-audio';
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);

      // Attach the same audio to one anchor speaker (positional)
      const positional = new T.PositionalAudio(this.listener);
      positional.setMediaElementSource(audioEl);
      positional.setRefDistance(4);
      positional.setRolloffFactor(2);
      positional.setDistanceModel('exponential');
      this._speakers[0].add(positional);

      this._audio = { el: audioEl, positional };
    }

    /* ---------- HUD overlay ---------- */
    _buildHUD(){
      const hud = document.createElement('div');
      hud.id = 'wc-pano-radio-hud';
      hud.innerHTML = `
        <style>
          #wc-pano-radio-hud{
            position:fixed;bottom:20px;left:20px;z-index:1000;
            font-family:'Share Tech Mono',monospace;color:#00ffe6;
            background:rgba(0,0,0,.75);border:1px solid rgba(0,255,230,.4);
            padding:12px 16px;min-width:240px;backdrop-filter:blur(6px);
            font-size:11px;letter-spacing:.05em;
          }
          #wc-pano-radio-hud .lbl{
            font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:.3em;
            color:#ff1a2e;display:block;margin-bottom:4px;
          }
          #wc-pano-radio-hud .nm{font-size:14px;color:#00ffe6;font-weight:bold;letter-spacing:.05em}
          #wc-pano-radio-hud .ar{font-size:10px;color:#c2a633;letter-spacing:.2em;margin-top:2px}
          #wc-pano-radio-hud .meta{margin-top:8px;font-size:9px;opacity:.7;letter-spacing:.15em}
          #wc-pano-radio-hud .live{
            display:inline-block;padding:2px 6px;background:#ff1a2e;color:#000;
            font-family:'Orbitron';font-size:8px;letter-spacing:.3em;font-weight:900;
            margin-bottom:6px;
          }
          #wc-pano-radio-hud .ctl{
            margin-top:10px;display:flex;gap:6px;
          }
          #wc-pano-radio-hud .ctl button{
            flex:1;padding:5px 8px;background:transparent;color:#00ffe6;
            border:1px solid rgba(0,255,230,.3);font-family:'Share Tech Mono';
            font-size:10px;cursor:pointer;letter-spacing:.1em;
          }
          #wc-pano-radio-hud .ctl button:hover{background:#00ffe6;color:#000}
        </style>
        <span class="live">◉ ON AIR</span>
        <span class="lbl">// 33.3FM // ${this.district}</span>
        <div class="nm" id="wc-r-track">— stand by —</div>
        <div class="ar" id="wc-r-artist">// signal locking</div>
        <div class="meta" id="wc-r-meta">DJ: — // SHOW: —</div>
        <div class="ctl">
          <button id="wc-r-play">▶ TUNE IN</button>
          <button id="wc-r-mute">MUTE</button>
        </div>
      `;
      document.body.appendChild(hud);
      this._hud = hud;

      // Wire controls
      const playBtn = hud.querySelector('#wc-r-play');
      const muteBtn = hud.querySelector('#wc-r-mute');

      playBtn.addEventListener('click', () => {
        if(!this._audio) return;
        if(this._audio.el.paused){
          // In a real deployment, set src to the 33.3FM stream URL
          // this._audio.el.src = 'https://stream.wiredchaos.xyz/333fm/live.mp3';
          this._audio.el.play().catch(e => console.warn('audio play blocked', e));
          playBtn.textContent = '❚❚ PAUSE';
        } else {
          this._audio.el.pause();
          playBtn.textContent = '▶ TUNE IN';
        }
      });
      muteBtn.addEventListener('click', () => {
        if(!this._audio) return;
        this._audio.el.muted = !this._audio.el.muted;
        muteBtn.textContent = this._audio.el.muted ? 'UNMUTE' : 'MUTE';
      });
    }

    /* ---------- Cross-frame listener for radio state changes ---------- */
    _registerListener(){
      // Listen for storage events from 33.3FM studio/broadcast tabs
      global.addEventListener('storage', (e) => {
        if(e.key === STATE_KEY) this._syncFromState();
      });
      this._syncFromState();
    }

    _syncFromState(){
      const state = lsGet(STATE_KEY, null);
      if(!state || !this._hud) return;

      const trackEl  = this._hud.querySelector('#wc-r-track');
      const artistEl = this._hud.querySelector('#wc-r-artist');
      const metaEl   = this._hud.querySelector('#wc-r-meta');

      if(state.track){
        trackEl.textContent  = state.track.title || '—';
        artistEl.textContent = '// ' + (state.track.artist || 'unknown');
      }
      metaEl.textContent =
        `DJ: ${state.currentDJ || '—'} // SHOW: ${state.show || '—'} // NEXT: ${state.nextShow || '—'}`;

      const trackId = state.track ? `${state.track.title}::${state.track.artist}` : null;
      if(trackId && trackId !== this._lastTrackId){
        this._lastTrackId = trackId;
        dl('wc_pano_radio_track_change', {
          district: this.district,
          track: state.track,
          dj: state.currentDJ
        });
        // Broadcast to citizen-broadcast-event channel
        const cbe = lsGet(CBE_KEY, {});
        cbe.lastRadioEvent = {
          district: this.district,
          ts: Date.now(),
          track: state.track,
          dj: state.currentDJ
        };
        lsSet(CBE_KEY, cbe);
      }
    }

    /* ---------- Per-district listener counter ---------- */
    _bumpListenerCount(delta = 1){
      const counts = lsGet(LISTEN_KEY, {});
      counts[this.district] = (counts[this.district] || 0) + delta;
      counts._updated = Date.now();
      lsSet(LISTEN_KEY, counts);
    }

    /* ---------- Public: toggle district takeover ---------- */
    requestDistrictTakeover(durationMin = 60){
      const sched = lsGet(SCHED_KEY, []);
      const now   = new Date();
      const time  = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}`;
      sched.unshift({
        time,
        title: this.district + ' TAKEOVER',
        host: 'DISTRICT',
        type: 'LIVE',
        duration: durationMin,
        description: `In-world takeover transmitted from ${this.district}`,
        status: 'queued',
        created: Date.now()
      });
      lsSet(SCHED_KEY, sched);
      dl('wc_pano_radio_district_takeover', {
        district: this.district,
        duration: durationMin
      });
      return true;
    }

    /* ---------- Render-loop tick ---------- */
    update(dt = 0.016){
      if(!this._mounted) return;
      this._tickAccum += dt;

      // Pulse speaker halos in time with the broadcast (light beat sync)
      const t = performance.now() * 0.001;
      const pulse = (Math.sin(t * 3.0) * 0.5 + 0.5);
      this._speakers.forEach((sp, i) => {
        if(sp.userData.halo){
          sp.userData.halo.material.opacity = 0.25 + pulse * 0.5;
          sp.userData.halo.scale.setScalar(1 + pulse * 0.15);
        }
        if(sp.userData.grilleGlow){
          sp.userData.grilleGlow.material.opacity = 0.4 + pulse * 0.5;
        }
        // gentle bob
        sp.position.y = this.speakerPositions[i][1] + Math.sin(t * 2 + i) * 0.05;
      });

      // Sync state every ~2 seconds (in case the storage event missed)
      if(this._tickAccum > 2.0){
        this._tickAccum = 0;
        this._syncFromState();
        this._bumpListenerCount(0); // refresh timestamp
      }
    }

    /* ---------- Cleanup ---------- */
    unmount(){
      if(!this._mounted) return;
      this._speakers.forEach(s => {
        s.parent && s.parent.remove(s);
        s.geometry && s.geometry.dispose();
        s.material && s.material.dispose && s.material.dispose();
      });
      this._speakers = [];
      if(this._audio){
        this._audio.el.pause();
        this._audio.el.remove();
      }
      if(this._hud) this._hud.remove();
      this._mounted = false;
    }
  }

  WCPanoRadio.VERSION = VERSION;
  WCPanoRadio.DISTRICT_DEFAULTS = DISTRICT_DEFAULTS;

  global.WCPanoRadio = WCPanoRadio;
})(typeof window !== 'undefined' ? window : globalThis);
