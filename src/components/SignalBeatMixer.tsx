import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import * as Tone from 'tone';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Share2, 
  Maximize2, 
  Sparkles, 
  Cpu, 
  Compass, 
  Zap, 
  ShieldAlert, 
  Award, 
  Check, 
  Coins, 
  Volume2, 
  Info,
  X
} from 'lucide-react';

// Define custom interface for the DJ agent state representation
interface Agent {
  id: string;
  name: string;
  role: string;
  glyph: string;
  color: string;
  layer: string;
  description: string;
  flagship?: boolean;
}

// Configured list of the 6 agent DJs
const AGENTS: Agent[] = [
  {
    id: 'red-fang',
    name: 'RED FANG',
    role: 'THE VOICE',
    glyph: '◢',
    color: '#ff1a2e',
    layer: 'VOCAL/CHORDS',
    description: 'Sultry cyber-vocals & harmonic progressions. Future-vintage soul.',
    flagship: true,
  },
  {
    id: 'pack',
    name: 'PACK',
    role: 'DRUMS',
    glyph: '◎',
    color: '#c2a633',
    layer: 'BEAT CORPS',
    description: 'Drill hi-hats, tight narrative snare and 808 kicks.',
  },
  {
    id: 'lens',
    name: 'LENS',
    role: 'LEAD',
    glyph: '◈',
    color: '#00ffe6',
    layer: 'LEAD SYNTH',
    description: 'Classic sawtooth arpeggios of opening-credits energy.',
  },
  {
    id: 'mint',
    name: 'MINT',
    role: 'BASS',
    glyph: '⟁',
    color: '#00ff88',
    layer: 'SUB BASS',
    description: 'Deep, heavy lo-fi analog sub-bass patterns that breathe.',
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    role: 'PAD',
    glyph: '◇',
    color: '#9945ff',
    layer: 'AMBIENT PAD',
    description: 'Luminous ambient atmosphere and multi-octave drone waves.',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'GLITCH',
    glyph: '◆',
    color: '#ff66cc',
    layer: 'GLITCH FEED',
    description: 'Hyperpop chaotic squeaks, noise gates, and digital signal lock.',
  },
];

// Configured list of active bonuses combos
interface Combo {
  id: string;
  name: string;
  requires: string[];
  description: string;
  reward: number;
  bannerSub: string;
}

const BONUSES: Combo[] = [
  {
    id: 'full-house',
    name: 'FULL HOUSE // SOLID SPECTRUM',
    requires: ['red-fang', 'pack', 'lens', 'mint', 'oracle', 'nexus'],
    description: 'Stack all 6 Agent DJs simultaneously in perfect synchronization',
    reward: 1000,
    bannerSub: '6 AGENTS ON THE WIRE // MATRIX CONNECTED // +⟁1,000 CREDITS',
  },
  {
    id: 'cipher-mode',
    name: 'CIPHER MODE // CORE TRIO',
    requires: ['red-fang', 'lens', 'oracle'],
    description: 'Sultry vocals paired with synths and celestial pads',
    reward: 350,
    bannerSub: 'RED FANG x LENS x ORACLE // CYBER SERENADE // +⟁350 CREDITS',
  },
  {
    id: 'pack-attack',
    name: 'PACK ATTACK // RHYTHM GRID',
    requires: ['pack', 'mint', 'nexus'],
    description: 'Drums, heavy sub-basses, and fast hyper-glitches',
    reward: 450,
    bannerSub: 'PACK x MINT x NEXUS // RHYTHM ENFORCED // +⟁450 CREDITS',
  },
  {
    id: 'sub-zero',
    name: 'SUB-ZERO TRINITY',
    requires: ['oracle', 'mint', 'red-fang'],
    description: 'Heavy bass underneath beautiful atmosphere and vocal cuts',
    reward: 300,
    bannerSub: 'ORACLE x MINT x RED FANG // DEEP CHILL CONSOLE // +⟁300 CREDITS',
  },
];

export default function SignalBeatMixer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['◤ MIXER CONSOLE ON LINE.', '◤ SYSTEM STABLE: TAPPING AGENTS LOOPS MIXES FREQUENCIES.']);
  const [bpm, setBpm] = useState<number>(120);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('red-fang');
  const [audioLoaded, setAudioLoaded] = useState<boolean>(false);
  
  // Storage balance interaction
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // Custom shares and mint overlays
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [mintOpen, setMintOpen] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintSuccess, setMintSuccess] = useState<boolean>(false);
  const [mintNetwork, setMintNetwork] = useState<string>('dogechain');

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Audio synths and loops refs to prevent re-renders wiping Tone setup
  const audioContextStartedRef = useRef<boolean>(false);
  const synthsRef = useRef<{ [key: string]: any }>({});
  const loopsRef = useRef<{ [key: string]: Tone.Loop | Tone.Sequence }>({});
  
  // Three.js object refs for state triggers in frame loops
  const vinylMeshRef = useRef<THREE.Mesh | null>(null);
  const activeSetRef = useRef<Set<string>>(new Set());
  const podiumMeshesRef = useRef<{ [key: string]: { base: THREE.Mesh; floatObj: THREE.Mesh; light: THREE.PointLight } }>({});
  const threeSceneRef = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(null);

  // Sync activeSetRef with activeAgents state so the Three.js animate loops can access it instantly
  useEffect(() => {
    activeSetRef.current = new Set(activeAgents);
    
    // Check for Combo Matches and award reward!
    const matchedCombo = BONUSES.find(combo => 
      combo.requires.every(reqId => activeAgents.includes(reqId))
    );

    if (matchedCombo && (!activeCombo || activeCombo.id !== matchedCombo.id)) {
      setActiveCombo(matchedCombo);
      addConsoleLog(`▶▶ ▶ BONUS COMBINATION ACHIEVED: ${matchedCombo.name}!`);
      
      // Award Credits Reward and dispatch a storage change event so App.tsx updates balance!
      const currentCredits = Number(localStorage.getItem('wc_xents_balance') || 0);
      const updatedCredits = currentCredits + matchedCombo.reward;
      localStorage.setItem('wc_xents_balance', String(updatedCredits));
      setUserBalance(updatedCredits);
      window.dispatchEvent(new Event('storage')); // trigger update globally
      
      // Flash console logs
      addConsoleLog(`▷ CREDITS AWARDED: +⟁${matchedCombo.reward} CREDITS WRITTEN TO LEDGER.`);
    } else if (!matchedCombo && activeCombo) {
      setActiveCombo(null);
    }
  }, [activeAgents, activeCombo]);

  // Load current balance on mount
  useEffect(() => {
    const bal = Number(localStorage.getItem('wc_xents_balance') || 0);
    setUserBalance(bal);
    
    // Parse URL parameter 'mix' if present to auto-load mix state
    const params = new URLSearchParams(window.location.search);
    const mixQuery = params.get('mix');
    if (mixQuery) {
      try {
        const mask = parseInt(mixQuery, 36);
        const loadedIds: string[] = [];
        AGENTS.forEach((agent, index) => {
          if ((mask & (1 << index)) !== 0) {
            loadedIds.push(agent.id);
          }
        });
        if (loadedIds.length > 0) {
          setActiveAgents(loadedIds);
          addConsoleLog(`◤ LOADED URL MIX PARAMS: DECRYPTED BITMASK [${mixQuery}] DELEGATED ON CHANNELS.`);
        }
      } catch (e) {
        console.warn('Failed parsing bitmask from URL query mix', e);
      }
    }
  }, []);

  // Helper logger
  const addConsoleLog = (text: string) => {
    setConsoleLogs(prev => {
      const updated = [...prev, `${text}`];
      if (updated.length > 35) updated.shift();
      return updated;
    });
    // Auto Scroll console teletype
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 40);
  };

  // Tone.js Audio Engine Setup
  const initializeAudioEngine = async () => {
    if (audioContextStartedRef.current) return;
    try {
      addConsoleLog('◤ INITIALIZING DIGITAL SYNTH SIGNAL CORES...');
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      audioContextStartedRef.current = true;
      
      // Create master reverb & delay lines
      const masterDelay = new Tone.PingPongDelay("8n.", 0.25).toDestination();
      masterDelay.wet.value = 0.15;
      
      const masterReverb = new Tone.Reverb(2.5).toDestination();
      masterReverb.wet.value = 0.12;

      // 1. RED FANG Node (Polyphonic backing pads/voice chords)
      const redFangSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.15, decay: 0.1, sustain: 0.8, release: 0.5 }
      }).connect(masterReverb);
      redFangSynth.volume.value = -12;
      synthsRef.current['red-fang'] = redFangSynth;

      // 2. PACK Synthesizers (Kick, Metronome Hat, Noise Snare)
      const packKick = new Tone.MembraneSynth().toDestination();
      packKick.volume.value = -5;
      const packHat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.02 }
      }).toDestination();
      packHat.volume.value = -18;
      const packSnare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.002, decay: 0.1, sustain: 0.05, release: 0.08 }
      }).connect(new Tone.Filter(1500, 'lowpass').toDestination());
      packSnare.volume.value = -14;
      
      synthsRef.current['pack'] = { kick: packKick, hat: packHat, snare: packSnare };

      // 3. LENS Mono lead synthesizer
      const lensSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.15 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2, baseFrequency: 300, octaves: 2.6 }
      }).connect(masterDelay);
      lensSynth.volume.value = -15;
      synthsRef.current['lens'] = lensSynth;

      // 4. MINT bass synthesizer
      const mintSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.2 }
      }).connect(new Tone.Filter(600, 'lowpass').toDestination());
      mintSynth.volume.value = -8;
      synthsRef.current['mint'] = mintSynth;

      // 5. ORACLE Ambient air-pad synthesizer
      const oracleSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.45, decay: 0.3, sustain: 1.0, release: 0.8 }
      }).connect(masterReverb);
      oracleSynth.volume.value = -14;
      synthsRef.current['oracle'] = oracleSynth;

      // 6. NEXUS glitch sound module
      const nexusSynth = new Tone.DuoSynth({
        harmonicity: 2.5,
        vibratoAmount: 0.6,
        vibratoRate: 12,
        voice0: { oscillator: { type: 'square' } },
        voice1: { oscillator: { type: 'sawtooth' } }
      }).connect(new Tone.BitCrusher(4).toDestination());
      nexusSynth.volume.value = -18;
      synthsRef.current['nexus'] = nexusSynth;

      // --- SEQUENCE AND LOOP STRUCTURE GENERATORS ---
      
      // Red Fangs Vocal/Chord Sequence Loop (changes chords every 4 beats)
      const redFangChordLoop = new Tone.Loop(time => {
        if (!activeSetRef.current.has('red-fang')) return;
        const chords = [
          ['A3', 'C4', 'E4', 'G4'], // Am7
          ['F3', 'A3', 'C4', 'E4'], // Fmaj7
          ['D3', 'F3', 'A3', 'C4'], // Dm7
          ['G3', 'B3', 'D4', 'F4']  // G7
        ];
        const step = Math.floor(Tone.Transport.ticks / (1920 * 2)) % chords.length;
        redFangSynth.triggerAttackRelease(chords[step], "2n", time);
      }, "2n");
      loopsRef.current['red-fang'] = redFangChordLoop;

      // Pack Drums grid sequencer (16th-note sequence)
      const packDrumSeq = new Tone.Sequence((time, step) => {
        if (!activeSetRef.current.has('pack')) return;
        
        // Kicks on step 0, 8, 10
        if (step === 0 || step === 8 || step === 10) {
          packKick.triggerAttackRelease("A1", "8n", time);
        }
        // Snare on step 4, 12
        if (step === 4 || step === 12) {
          packSnare.triggerAttack(time);
        }
        // Hihats continuous syncopation
        if (step % 2 === 1 || step === 2 || step === 6 || step === 14) {
          packHat.triggerAttackRelease("32n", time);
        }
      }, Array.apply(null, Array(16)).map((_, i) => i), "16n");
      loopsRef.current['pack'] = packDrumSeq;

      // Lens Lead arpeggios sequencer
      const lensArpSeq = new Tone.Sequence((time, step) => {
        if (!activeSetRef.current.has('lens')) return;
        const melodies = [
          'A4', 'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'C5',
          'D4', 'F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'F4'
        ];
        // Rotate note index based on step
        const note = melodies[step % melodies.length];
        lensSynth.triggerAttackRelease(note, "16n", time);
      }, Array.apply(null, Array(8)).map((_, i) => i), "8n");
      loopsRef.current['lens'] = lensArpSeq;

      // Mint sub-bass loops (triggers deep notes on 1st/3rd quarter beats)
      const mintBassLoop = new Tone.Loop(time => {
        if (!activeSetRef.current.has('mint')) return;
        const notes = ['A1', 'C2', 'F1', 'G1'];
        const idx = Math.floor(Tone.Transport.ticks / 1920) % notes.length;
        mintSynth.triggerAttackRelease(notes[idx], "4n", time);
      }, "2n");
      loopsRef.current['mint'] = mintBassLoop;

      // Oracle slow ambient drone pads
      const oraclePadLoop = new Tone.Loop(time => {
        if (!activeSetRef.current.has('oracle')) return;
        const voices = [
          ['E3', 'A3', 'C4'],
          ['D3', 'G3', 'B3'],
          ['C3', 'F3', 'A3']
        ];
        const step = Math.floor(Tone.Transport.ticks / 3840) % voices.length;
        oracleSynth.triggerAttackRelease(voices[step], "1m", time);
      }, "1m");
      loopsRef.current['oracle'] = oraclePadLoop;

      // Nexus modular noise/glitch bursts triggered pseudo-randomly
      const nexusGlitchLoop = new Tone.Loop(time => {
        if (!activeSetRef.current.has('nexus')) return;
        // Trigger high metal burst randomly
        const notes = ['A5', 'E6', 'C6', 'G5', 'A6'];
        const rNote = notes[Math.floor(Math.random() * notes.length)];
        nexusSynth.triggerAttackRelease(rNote, "32n", time);
      }, "8n");
      loopsRef.current['nexus'] = nexusGlitchLoop;

      // Start all loops, but triggers depend on corresponding activeSetRef.current contents!
      redFangChordLoop.start(0);
      packDrumSeq.start(0);
      lensArpSeq.start(0);
      mintBassLoop.start(0);
      oraclePadLoop.start(0);
      nexusGlitchLoop.start(0);

      setAudioLoaded(true);
      addConsoleLog('◤ AUDIO ENGINE LOADED: ALL 6 SYNTH CORES DEPLOYED & SYNCED AT 120 BPM.');
    } catch (e) {
      console.error('Tone.js initial failed', e);
      addConsoleLog('❌ UNABLE TO START AUDIO CONTEXT. TAP RETRY.');
    }
  };

  // Three.js 3D Visuals Engine Lifecycle
  useEffect(() => {
    if (!canvasRef.current) return;

    // Dimensions
    const width = canvasRef.current.clientWidth || 600;
    const height = canvasRef.current.clientHeight || 450;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 14);
    camera.lookAt(0, 0, 0);

    // Helpers & Grid representing electronic frequencies wires
    const gridHelper = new THREE.GridHelper(20, 20, 0x00ffe6, 0x222222);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Dynamic central shining visual ring representing target radius
    const ringGeo = new THREE.RingGeometry(5.4, 5.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffe6, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const freqRing = new THREE.Mesh(ringGeo, ringMat);
    freqRing.rotation.x = Math.PI / 2;
    freqRing.position.y = -0.48;
    scene.add(freqRing);

    // Central 3D Vinyl record cylinder
    const vinylGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.12, 64);
    
    // Create dual-tone concentric groove material
    const vinylMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.25,
      metalness: 0.8,
      bumpScale: 0.05
    });

    const vinylMesh = new THREE.Mesh(vinylGeo, vinylMat);
    vinylMeshRef.current = vinylMesh;
    vinylMesh.position.y = -0.3;
    scene.add(vinylMesh);

    // Vinyl middle circular graphic plate
    const plateGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.14, 32);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xff1a2e,
      roughness: 0.4,
      metalness: 0.3
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = 0.01;
    vinylMesh.add(plateMesh);

    // Vinyl tiny core metal spindle peg
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.3;
    vinylMesh.add(coreMesh);

    // 6 Podiums positioned at radial orbits for each of the 6 Agent DJs
    const podiums: { [key: string]: { base: THREE.Mesh; floatObj: THREE.Mesh; light: THREE.PointLight } } = {};
    const radius = 6.2;

    AGENTS.forEach((agent, index) => {
      const angle = (index / AGENTS.length) * Math.PI * 2;
      const pX = Math.cos(angle) * radius;
      const pZ = Math.sin(angle) * radius;

      // Podium cylinder geometry
      const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.5,
        transparent: true,
        opacity: 0.85
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(pX, -0.1, pZ);
      scene.add(baseMesh);

      // Glowing trim ring
      const trimGeo = new THREE.RingGeometry(0.75, 0.8, 16);
      const trimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(agent.color), side: THREE.DoubleSide });
      const trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.rotation.x = Math.PI / 2;
      trimMesh.position.y = 0.41;
      baseMesh.add(trimMesh);

      // Interactive 3D floating hologram representing DJ capsule (OctahedronGeometry)
      const floatGeo = new THREE.OctahedronGeometry(0.48, 0);
      const floatMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(agent.color),
        emissive: new THREE.Color(agent.color),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.6,
        wireframe: true
      });
      const floatObj = new THREE.Mesh(floatGeo, floatMat);
      floatObj.position.y = 1.1; // Float above podium
      baseMesh.add(floatObj);

      // PointLight that lights up the floating mesh and record area when active
      const light = new THREE.PointLight(new THREE.Color(agent.color), 0, 8);
      light.position.set(0, 1.5, 0);
      baseMesh.add(light);

      podiums[agent.id] = {
        base: baseMesh,
        floatObj,
        light
      };
    });

    podiumMeshesRef.current = podiums;

    // Dynamic Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00ffe6, 1.25);
    dirLight1.position.set(3, 10, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff1a2e, 0.7);
    dirLight2.position.set(-6, 8, -3);
    scene.add(dirLight2);

    threeSceneRef.current = { renderer, scene, camera };

    // Set interactive vinyl stickers and details
    let rotSpeed = 0;
    let targetRotSpeed = 0;
    let clock = new THREE.Clock();

    // Render loop helper function
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Spin central vinyl record depending on play state
      targetRotSpeed = activeSetRef.current.size > 0 ? 0.95 : 0;
      rotSpeed += (targetRotSpeed - rotSpeed) * 0.05;
      
      if (vinylMesh) {
        vinylMesh.rotation.y += rotSpeed * 0.035;
      }

      // Orbital slow camera sweep
      if (camera) {
        const sweepAngle = time * 0.05;
        camera.position.x = Math.sin(sweepAngle) * 15;
        camera.position.z = Math.cos(sweepAngle) * 15;
        camera.position.y = 8 + Math.sin(time * 0.1) * 2.5;
        camera.lookAt(0, -0.5, 0);
      }

      // Sync floating anims and emissive glowing for EACH podium based on active state of channel
      AGENTS.forEach((agent) => {
        const pod = podiums[agent.id];
        if (!pod) return;

        const isActive = activeSetRef.current.has(agent.id);
        
        // Rise and high glow values when active, low values when idle
        const targetY = isActive ? 0.2 : -0.1;
        const targetLight = isActive ? 1.8 : 0.05;
        const targetScaleObj = isActive ? 1.2 : 0.85;
        
        pod.base.position.y += (targetY - pod.base.position.y) * 0.1;
        pod.light.intensity += (targetLight - pod.light.intensity) * 0.1;
        
        // Spin and float the hologram shape based on sine-waves
        pod.floatObj.rotation.y += isActive ? 0.04 : 0.01;
        pod.floatObj.rotation.x += isActive ? 0.025 : 0.005;
        pod.floatObj.position.y = 1.15 + Math.sin(time * 2.5 + parseInt(agent.id, 36) * 0.1) * 0.16;
        
        const floatScale = pod.floatObj.scale;
        floatScale.setScalar(floatScale.x + (targetScaleObj - floatScale.x) * 0.1);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer to handle Responsive Canvas dimensions
    const handleResize = () => {
      if (!canvasRef.current || !threeSceneRef.current) return;
      const w = canvasRef.current.parentElement?.clientWidth || width;
      const h = canvasRef.current.parentElement?.clientHeight || height;
      
      threeSceneRef.current.camera.aspect = w / h;
      threeSceneRef.current.camera.updateProjectionMatrix();
      threeSceneRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gridGeoDispose(scene);
    };

    function gridGeoDispose(sc: THREE.Scene) {
      sc.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        if (object.geometry) object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else if (object.material) {
          object.material.dispose();
        }
      });
    }
  }, []);

  // Sync Transport BPM when changed
  const handleBpmChange = (newVal: number) => {
    setBpm(newVal);
    if (audioContextStartedRef.current) {
      Tone.Transport.bpm.value = newVal;
    }
    addConsoleLog(`◤ TEMPO CLIPPED: CLOCKED AT ${newVal} BPM.`);
  };

  // Turn Master Volume Playback On or Off
  const toggleMasterPlayback = async () => {
    if (!audioContextStartedRef.current) {
      await initializeAudioEngine();
    }
    
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
      addConsoleLog('◤ SYSTEM CONSOLE SUSPENDED. AUDIO LOOPS STOPPING AT GRID BOUNDARY.');
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
      addConsoleLog('▶ SYSTEM ON AIR: WAVE OSCILLATORS BROADCASTING IN DEVIANT CHANNELS.');
      
      // If no channels active, auto-activate Red Fang so something plays!
      if (activeAgents.length === 0) {
        setActiveAgents(['red-fang']);
        addConsoleLog('◤ AUTOMATIC SELECTION: SYSTEM LAUNCHED RED FANG BACKING PAD.');
      }
    }
  };

  // Toggle state of an individual agent channel
  const toggleAgent = async (agentId: string) => {
    if (!audioContextStartedRef.current) {
      await initializeAudioEngine();
    }
    
    let updated: string[];
    const isCurrentlyActive = activeAgents.includes(agentId);
    
    if (isCurrentlyActive) {
      updated = activeAgents.filter(id => id !== agentId);
      addConsoleLog(`◤ CHANNEL OFFLINE: ${agentId.toUpperCase()} CUT OFF FROM STREAM.`);
    } else {
      updated = [...activeAgents, agentId];
      addConsoleLog(`◤ CHANNEL ONLINE: ${agentId.toUpperCase()} STACKED TO HARMONICS.`);
    }

    setActiveAgents(updated);
    setSelectedAgentId(agentId);

    // Auto trigger Tone play if suspended on silent click
    if (!isPlaying && updated.length > 0) {
      Tone.Transport.start();
      setIsPlaying(true);
      addConsoleLog('▶ AUTO BROADCAST DETECTED: RESUMING WAVE ENVELOPE.');
    }
  };

  const clearAllChannels = () => {
    setActiveAgents([]);
    addConsoleLog('◤ ALL CHANNELS ENCRYPTED & PURGED. SILENCING BEAT GRIDS.');
  };

  // Copy shareable mix link
  const generateShareLink = () => {
    // Generate 36bit bitmask from active index channels
    let mask = 0;
    AGENTS.forEach((agent, idx) => {
      if (activeAgents.includes(agent.id)) {
        mask |= (1 << idx);
      }
    });
    
    const code = mask.toString(36);
    const origin = window.location.origin + window.location.pathname;
    const shareUrl = `${origin}?mix=${code}`;
    
    navigator.clipboard.writeText(shareUrl);
    addConsoleLog(`◤ URL BITMASK SHUNTED [${code}]: SHARE LINK WRITTEN TO CLIPBOARD.`);
    setShareOpen(true);
    
    // Auto-alert tooltip feedback
    setTimeout(() => {
      setShareOpen(false);
    }, 4500);
  };

  // Process mint simulation and update localstorage
  const handleMintTransaction = () => {
    if (userBalance < 2500) {
      addConsoleLog('❌ MINING ERROR: INSUFFICIENT CREDITS (REQUIRES ⟁2,500 CREDITS IN LEDGER).');
      return;
    }
    
    setIsMinting(true);
    addConsoleLog(`◤ INITIATING ON-CHAIN TRANSMISSION FOR ${mintNetwork.toUpperCase()} GATEWAY...`);
    
    setTimeout(() => {
      const remaining = userBalance - 2500;
      localStorage.setItem('wc_xents_balance', String(remaining));
      setUserBalance(remaining);
      window.dispatchEvent(new Event('storage')); // Alert app UI globally
      
      setIsMinting(false);
      setMintSuccess(true);
      addConsoleLog(`▶ TRANSMISSION SUCCESSFUL! MINTED SIGNAL MIX ON ${mintNetwork.toUpperCase()}. LEDGER BAL: ⟁${remaining}.`);
    }, 2800);
  };

  const activeAgentData = AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0];

  return (
    <div className="flex flex-col gap-6 relative overflow-visible rounded-xl font-mono-tech border border-neutral-900 bg-neutral-950/80 p-4 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      
      {/* Dynamic top banner alert when a combo is unlocked */}
      <AnimatePresence>
        {activeCombo && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scaleY: 0 }}
            animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0 }}
            className="w-full bg-gradient-to-r from-cyan-950/40 via-neutral-950 to-rose-950/40 border-2 border-[#00ffe6] rounded-lg p-4 mb-4 shadow-[0_0_25px_rgba(0,255,230,0.45)] flex flex-col md:flex-row justify-between items-center gap-4 text-center overflow-hidden z-10"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-[#00ffe6] text-black font-orbitron font-black text-lg rounded-full animate-bounce shadow-[0_0_12px_rgba(0,255,230,0.6)]">
                ◤
              </div>
              <div className="text-left font-orbitron">
                <span className="text-[10px] font-bold text-[#00ffe6] block tracking-widest uppercase">STATION COMBINATION MATCH!</span>
                <h4 className="text-sm font-black text-white tracking-wider">{activeCombo.name}</h4>
                <p className="text-[10px] text-neutral-400 font-mono-tech mt-0.5">{activeCombo.bannerSub}</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end justify-center">
              <span className="text-emerald-400 font-bold font-major-mono text-xs">+⟁{activeCombo.reward} CREDITS</span>
              <span className="text-[9px] text-neutral-500 font-mono mt-1">Written to On-Chain Balance</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: ACTIVE SQUEAK CONTROLLER & BIO CARD */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-black/60 border border-neutral-900 rounded-lg p-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-1">
            <Cpu className="h-4 w-4 text-[#00ffe6] animate-pulse" />
            <h3 className="font-orbitron font-extrabold text-[10px] tracking-widest text-neutral-500 uppercase">
              AGENT TELEMETRY
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-full border-2 flex items-center justify-center text-lg font-orbitron font-extrabold shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                style={{ color: activeAgentData.color, borderColor: activeAgentData.color }}
              >
                {activeAgentData.glyph}
              </div>
              <div>
                <h4 className="font-orbitron font-black text-sm text-white tracking-widest">{activeAgentData.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-neutral-500 tracking-wider">ROLE:</span>
                  <span className="text-[9px] font-black text-[#c2a633] tracking-wide">{activeAgentData.role}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-900 rounded p-3 text-[11px] leading-relaxed text-neutral-400 font-mono text-xs select-none">
              <span className="text-[9px] text-neutral-600 block mb-1 font-orbitron font-bold">WAVEFORM LAYER</span>
              <span className="text-white font-bold block mb-2">{activeAgentData.layer}</span>
              {activeAgentData.description}
            </div>

            <div className="border border-neutral-900 bg-neutral-950/50 p-3 rounded text-[11px] leading-relaxed">
              <span className="text-[9px] font-orbitron font-bold text-neutral-600 block mb-1.5 uppercase">STATION FREQUENCY MODULATOR</span>
              <div className="flex justify-between items-center gap-2 text-xs mb-2">
                <span className="text-neutral-500 text-[10px]">TEMPO GRID</span>
                <span className="text-[#00ffe6] font-bold font-mono">{bpm} BPM</span>
              </div>
              <input 
                type="range"
                min="90"
                max="160"
                step="2"
                value={bpm}
                onChange={e => handleBpmChange(Number(e.target.value))}
                className="w-full accent-[#00ffe6] bg-neutral-900 h-1 rounded cursor-pointer outline-none"
              />
            </div>

            <div className="flex-1 min-h-[140px] flex flex-col border border-neutral-900 bg-neutral-950/80 rounded overflow-hidden">
              <div className="bg-neutral-900/60 p-2 text-[9px] font-orbitron font-black text-neutral-400 tracking-wider flex items-center justify-between border-b border-neutral-900">
                <span>◤ CHANNEL ON-AIR LOGS</span>
                <div className="flex gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
              
              <div 
                ref={scrollRef}
                className="p-3 font-mono text-[9px] text-[#e3e3e3] leading-normal flex-1 overflow-y-auto max-h-[160px] scrollbar-thin scrollbar-thumb-neutral-800"
              >
                {consoleLogs.map((log, index) => (
                  <div key={index} className="mb-1 italic whitespace-pre-wrap leading-tight font-vt323 text-xs tracking-wider">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: THREE.JS 3D FREQUENCY SOUND STAGE */}
        <div className="lg:col-span-6 flex flex-col gap-4 relative">
          <div className="flex-1 relative border border-neutral-900 rounded-lg overflow-hidden bg-black shadow-inner flex items-center justify-center min-h-[360px] xl:min-h-[420px]">
            
            {/* Holographic matrix guidelines */}
            <div className="absolute top-3 left-3 flex flex-col gap-0.5 pointer-events-none select-none z-10 font-major-mono text-[10px] text-white/50">
              <span>◤ FREQ: 33.3FM</span>
              <span>◤ SIGNAL: DIRECT LINK</span>
              <span>◤ STATUS: ON GRID</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none select-none z-10 font-orbitron text-[9px] text-neutral-500 bg-neutral-950/60 border border-neutral-900/80 px-2 py-0.5 rounded">
              <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span>3D SOUND-STAGE CANVAS</span>
            </div>

            {/* Canvas mounting viewport */}
            <canvas ref={canvasRef} className="w-full h-full absolute inset-0 block cursor-grab active:cursor-grabbing" />
            
            {/* If audio not initialized yet, overlay warning */}
            {!audioLoaded && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center items-center z-10 pointer-events-auto px-4 text-center">
                <button 
                  onClick={initializeAudioEngine}
                  className="bg-neutral-950/90 border border-[#00ffe6]/40 text-[#00ffe6] hover:bg-[#00ffe6] hover:text-black py-2.5 px-5 font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-[0_0_15px_rgba(0,255,230,0.2)] rounded"
                >
                  ◤ STACK DRUM CORES & WAVE SYNTHS
                </button>
              </div>
            )}
            
            {/* Scanlines overlay effect to strengthen CRT cyberpunk vibe */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4))] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,6px_100%] opacity-40" />
          </div>
          
          {/* Action Bar controls below 3D window */}
          <div className="grid grid-cols-4 gap-2 bg-neutral-950/70 border border-neutral-900 p-2.5 rounded-lg">
            <button 
              onClick={toggleMasterPlayback}
              className={`py-2 px-3 border font-orbitron font-extrabold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPlaying 
                ? 'bg-rose-950/50 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-black' 
                : 'bg-emerald-950/50 border-emerald-500 text-emerald-400 hover:bg-emerald-400 hover:text-black'
              }`}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <button 
              onClick={clearAllChannels}
              className="py-2 px-3 border border-neutral-800 text-neutral-400 bg-neutral-900/40 hover:bg-neutral-900 hover:text-white font-orbitron font-bold text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> CLEAR ALL
            </button>

            <button 
              onClick={generateShareLink}
              className="py-2 px-3 border border-[#00ffe6]/40 text-[#00ffe6] bg-[#00ffe6]/5 hover:bg-[#00ffe6] hover:text-black font-orbitron font-bold text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="h-3 w-3" /> SHARE MIX
            </button>

            <button 
              onClick={() => setMintOpen(true)}
              className="py-2 px-3 border border-[#c2a633] text-[#c2a633] bg-[#c2a633]/10 hover:bg-[#c2a633] hover:text-black font-orbitron font-extrabold text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" /> MINT BLOCK
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ON-AIR DJ CHANNELS GRID */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-black/60 border border-neutral-900 rounded-lg p-4 justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-1">
              <Compass className="h-4 w-4 text-[#c2a633] animate-pulse" />
              <h3 className="font-orbitron font-extrabold text-[10px] tracking-widest text-neutral-500 uppercase">
                COMBINATOR PATTERNS
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {BONUSES.map((bonus) => {
                const elementsMatched = bonus.requires.filter(reqId => activeAgents.includes(reqId)).length;
                const isMatched = elementsMatched === bonus.requires.length;
                
                return (
                  <div 
                    key={bonus.id} 
                    className={`border p-2.5 rounded-lg transition-all select-none ${
                      isMatched 
                      ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-white' 
                      : 'bg-neutral-950/40 border-neutral-900 text-neutral-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className={`font-orbitron text-[10px] font-black tracking-wide ${isMatched ? 'text-emerald-400' : 'text-neutral-400'}`}>
                        {bonus.name.split('//')[0]}
                      </span>
                      <span className={`text-[9px] font-bold ${isMatched ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        +⟁{bonus.reward}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-neutral-500 leading-tight mb-2 font-mono-tech">
                      {bonus.description}
                    </p>

                    <div className="flex gap-1">
                      {bonus.requires.map(reqId => {
                        const matchingAgent = AGENTS.find(a => a.id === reqId);
                        const isActive = activeAgents.includes(reqId);
                        return (
                          <span 
                            key={reqId}
                            className={`text-[8px] font-bold font-mono px-1 py-0.5 rounded border ${
                              isActive 
                              ? 'bg-neutral-800 text-white border-neutral-700' 
                              : 'bg-transparent text-neutral-600 border-neutral-950'
                            }`}
                            style={isActive ? { borderColor: matchingAgent?.color, color: matchingAgent?.color } : {}}
                          >
                            {matchingAgent?.glyph} {matchingAgent?.name.split(' ')[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-neutral-900 bg-neutral-950/60 p-3 rounded-lg flex flex-col items-center text-center justify-center gap-2 mt-4">
            <Award className="h-6 w-6 text-[#c2a633] animate-pulse" />
            <div className="font-orbitron">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">CRYPTO LEDGER BALANCE</span>
              <span className="text-sm font-black text-[#c2a633] tracking-wider">⟁ {userBalance.toLocaleString()} CREDITS</span>
            </div>
            <p className="text-[9px] text-neutral-500 font-mono-tech">
              Mine combos to unlock more sovereign credits instantly.
            </p>
          </div>
        </div>

      </div>

      {/* FOOTER DASHBOARD CORE: THE 6 DJ CHANNEL INTERACTION SLIDER PLATES */}
      <div className="mt-4 border-t border-neutral-900 pt-6">
        <h3 className="font-orbitron font-extrabold text-[10px] tracking-widest text-[#00ffe6] mb-4 uppercase">
          ◢ MIX BOARD CHANNEL SLIDERS (STACK AND MIX DIGITAL AGENTS RESONANCES)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {AGENTS.map((agent) => {
            const isActive = activeAgents.includes(agent.id);
            const isSelected = selectedAgentId === agent.id;
            
            return (
              <div 
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  addConsoleLog(`◤ CONSOLE LOG: DIRECT CHANNELS SELECTION -> ${agent.name}.`);
                }}
                className={`relative border-2 p-3.5 rounded-xl cursor-pointer select-none transition-all flex flex-col justify-between ${
                  isSelected 
                  ? 'bg-neutral-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.08)]' 
                  : 'bg-black/40 border-neutral-900 hover:border-neutral-800'
                }`}
                style={isSelected ? { borderColor: agent.color } : {}}
              >
                {/* Channel Active switch indicator */}
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-neutral-500 font-orbitron font-black">{agent.role}</span>
                    <span className="text-xs font-black text-white tracking-widest font-orbitron">{agent.name}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAgent(agent.id);
                    }}
                    className={`h-5 w-5 flex items-center justify-center rounded-md font-orbitron font-extrabold text-[9px] border transition-all cursor-pointer ${
                      isActive 
                      ? 'bg-[#00ffe6]/20 border-[#00ffe6] text-[#00ffe6] shadow-[0_0_8px_rgba(0,255,230,0.3)]' 
                      : 'bg-neutral-950 border-neutral-850 text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {isActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Sub layer layout */}
                <div className="flex items-end justify-between font-mono text-[9px]">
                  <span className="text-neutral-600 block">{agent.layer}</span>
                  <span 
                    className="font-black text-lg font-orbitron line-clamp-1"
                    style={{ color: agent.color }}
                  >
                    {agent.glyph}
                  </span>
                </div>

                {/* Vertical slider graphical indicator representing channel volume */}
                <div className="mt-3.5 h-[50px] bg-neutral-950 border border-neutral-900 rounded p-1 flex flex-col justify-end overflow-hidden relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: isActive ? '85%' : '8%' }}
                    transition={{ type: 'spring', stiffness: 80 }}
                    className="w-full rounded-sm"
                    style={{ 
                      backgroundColor: agent.color,
                      opacity: isActive ? 0.75 : 0.15,
                      boxShadow: isActive ? `0 0 10px ${agent.color}` : 'none'
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-neutral-500 font-orbitron uppercase pointer-events-none">
                    {isActive ? 'STACKED' : 'IDLE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: SHARE MIX DETAILS */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 font-mono-tech select-none"
          >
            <div className="bg-neutral-950 border-2 border-[#00ffe6] rounded-xl p-6 max-w-md w-full relative">
              <button 
                onClick={() => setShareOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col items-center text-center gap-3">
                <Check className="h-10 w-10 text-emerald-400 border border-emerald-500 p-2 rounded-full animate-bounce shadow-[0_0_12px_rgba(52,211,153,0.3)]" />
                <h3 className="font-orbitron font-black text-white text-base tracking-wide uppercase">SIGNAL SHUNT EMBEDDED</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your customized signal mix containing {activeAgents.length} stacked channels has been successfully encrypted, translated to bitmask code, and written to your clipboard!
                </p>
                
                <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded w-full font-mono text-[10px] text-[#00ffe6] select-all overflow-x-auto text-left whitespace-nowrap">
                  {window.location.origin + window.location.pathname}?mix={activeAgents.map((_, i) => activeAgents.includes(AGENTS[i]?.id) ? 1 : 0).join('')}
                </div>
                
                <button 
                  onClick={() => setShareOpen(false)}
                  className="mt-4 bg-[#00ffe6] hover:bg-[#00ffe6]/80 text-black font-orbitron font-extrabold text-xs tracking-wider py-2 px-6 rounded cursor-pointer"
                >
                  ◤ DONE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: MINT DIGITAL RECORD NFT */}
      <AnimatePresence>
        {mintOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 font-mono-tech"
          >
            <div className="bg-neutral-950 border-2 border-[#c2a633] rounded-xl p-6 max-w-md w-full relative">
              <button 
                onClick={() => {
                  setMintOpen(false);
                  setMintSuccess(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {!mintSuccess ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                    <Sparkles className="h-5 w-5 text-[#c2a633]" />
                    <h3 className="font-orbitron font-extrabold text-sm text-white tracking-widest uppercase">
                      MINT SYSTEM MIX NFT
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Compile your current frequency mix of <span className="text-white font-bold font-mono">{activeAgents.length} active channels</span> directly into an immutable cryptographic NFT record Block!
                  </p>

                  <div className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-lg">
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span className="text-neutral-500">MINT RATE</span>
                      <span className="text-[#c2a633] font-bold font-major-mono animate-pulse">⟁ 2,500 CREDITS</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-neutral-900 pt-3">
                      <span className="text-neutral-500">LEDGER BALANCE</span>
                      <span className="text-white font-mono">⟁ {userBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-orbitron text-neutral-500 mb-1.5 uppercase">TARGET BLOCKCHAIN TRANSITIONS</label>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs select-none">
                      <div 
                        onClick={() => setMintNetwork('dogechain')}
                        className={`p-2 border rounded cursor-pointer transition-all ${mintNetwork === 'dogechain' ? 'border-[#c2a633] text-[#c2a633] bg-[#c2a633]/5' : 'border-neutral-900 bg-neutral-900/40 text-neutral-500'}`}
                      >
                        DOGECHAIN
                      </div>
                      <div 
                        onClick={() => setMintNetwork('base')}
                        className={`p-2 border rounded cursor-pointer transition-all ${mintNetwork === 'base' ? 'border-[#0055ff] text-[#0055ff] bg-[#0055ff]/5' : 'border-neutral-900 bg-neutral-900/40 text-neutral-500'}`}
                      >
                        BASE L2
                      </div>
                      <div 
                        onClick={() => setMintNetwork('solana')}
                        className={`p-2 border rounded cursor-pointer transition-all ${mintNetwork === 'solana' ? 'border-[#9945ff] text-[#9945ff] bg-[#9945ff]/5' : 'border-neutral-900 bg-neutral-900/40 text-neutral-500'}`}
                      >
                        SOLANA L1
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleMintTransaction}
                    disabled={isMinting || userBalance < 2500 || activeAgents.length === 0}
                    className="w-full mt-2 bg-[#c2a633] hover:bg-[#c2a633]/80 text-black disabled:bg-neutral-900 disabled:text-neutral-600 font-orbitron font-extrabold text-xs tracking-widest py-3 rounded cursor-pointer uppercase shadow-[0_0_12px_rgba(194,166,51,0.2)]"
                  >
                    {isMinting ? 'COMPILING CRYPTOGRAPHY CHANNELS...' : '◤ RUN MINDER'}
                  </button>

                  {userBalance < 2500 && (
                    <span className="text-rose-500 text-[9px] text-center font-bold block">
                      ⚠ ledgers are depleted! Mine combos to unlock credits.
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <Check className="h-10 w-10 text-emerald-400 border border-emerald-500 p-2 rounded-full animate-bounce" />
                  <h3 className="font-orbitron font-black text-white text-base tracking-wide uppercase font-major-mono">MINT COMPLETED!</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    NFT Block successfully written to the ledger on the <span className="text-[#c2a633] font-bold">{mintNetwork.toUpperCase()}</span> network. Tracks layers integrated, metadata shunted!
                  </p>
                  
                  <div className="bg-neutral-900 border border-neutral-850 p-2 rounded mt-2 text-[9px] text-[#00ffe6] select-all font-mono">
                    TXN: 0x892a09ff433dcdc98de1aef83dd802fe6192a9cb18bf3...
                  </div>

                  <button 
                    onClick={() => {
                      setMintOpen(false);
                      setMintSuccess(false);
                    }}
                    className="mt-4 bg-[#c2a633] hover:bg-[#c2a633]/80 text-black font-orbitron font-extrabold text-xs tracking-wider py-2 px-6 rounded cursor-pointer"
                  >
                    ◤ DISMISS CONSOLE
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
