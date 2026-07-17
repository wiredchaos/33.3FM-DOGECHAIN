/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Disc, 
  Shield, 
  ExternalLink, 
  ArrowLeft, 
  Radio, 
  Flame, 
  Volume2, 
  Sliders, 
  Activity, 
  Tv, 
  Cpu 
} from 'lucide-react';
import { Artist, RadioTrack } from '../types';
import CyberAvatar from './CyberAvatar';

interface ArtistViewProps {
  artistId: string;
  artists: Artist[];
  tracks: RadioTrack[];
  onBack: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export default function ArtistView({
  artistId,
  artists,
  tracks,
  onBack,
  onNavigate
}: ArtistViewProps) {
  const artist = artists.find(a => a.id === artistId);

  // Dynamic Telemetry State Variables
  const [frequencyCrackle, setFrequencyCrackle] = useState(30);
  const [vocoderDecay, setVocoderDecay] = useState(50);
  const [hyperCharge, setHyperCharge] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // Sound play trigger state feedback
  const [soundFeedback, setSoundFeedback] = useState('');

  // Canvas visualizer reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!artist) {
    return (
      <div className="text-center py-12 border border-neutral-900 rounded bg-black/60">
        <h3 className="font-orbitron font-extrabold text-red-500">ARTIST OCCUPANT NOT SECURED</h3>
        <p className="font-mono text-xs text-neutral-500 mt-2">Selected record hash mismatch.</p>
        <button
          onClick={onBack}
          className="mt-6 py-2 px-4 bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold font-orbitron text-xs hover:text-white"
        >
          GO BACK
        </button>
      </div>
    );
  }

  // Retrieve artist specific metadata modeled on bottom-right card template
  const getProfileMetadata = (id: string) => {
    switch (id) {
      case 'red-fang':
        return {
          role: 'RADIO QUEEN / VOICE ARCHITECT / FREQUENCY MASTER',
          weapon: 'CRIMSON VOICE & V33 FREQUENCY DECAY',
          station: '33.3 FM',
          origin: 'DISTRICT D7 — SPECTRUM DEEP',
          energy: 'SULTRY / POWERFUL / MYSTERIOUS',
          quote: '“YOU\'RE TUNED INTO 33.3 FM... WHERE THE SIGNAL BITES BACK.”',
          cardTheme: 'border-[#ff1a2e] text-[#ff1a2e]',
          accentGlow: 'rgba(255, 26, 46, 0.15)'
        };
      case 'pack':
        return {
          role: 'TACTICAL LYRICIST / STORYTELLER / SIGNAL-LOCK DISPATCHER',
          weapon: 'BASS HARMONICS & SPOKEN SHUNT',
          station: '33.3 FM',
          origin: 'DISTRICT D4 — PACK SECTOR',
          energy: 'AGGRESSIVE / DIRECT / KINETIC',
          quote: '“ENERGY MUTATES AND CUTS DEEPER THAN THE DOOM SCROLL.”',
          cardTheme: 'border-[#c2a633] text-[#c2a633]',
          accentGlow: 'rgba(194, 166, 51, 0.15)'
        };
      case 'lens':
        return {
          role: 'CINEMATOGRAPHER OF SOUND / SOUNDSCAPE SCORE ARCHITECT',
          weapon: 'HOLOGRAPHIC SYNTH ARPS & CHROME FILTERS',
          station: '33.3 FM',
          origin: 'DISTRICT D2 — LENS QUARTER',
          energy: 'CINEMATIC / DEEP FOCUS / MEDITATIVE BUILD',
          quote: '“WE FRAME EVERY FREQUENCY DROP. COMMUTES BECOME OPENING CREDITS.”',
          cardTheme: 'border-[#00ffe6] text-[#00ffe6]',
          accentGlow: 'rgba(0, 255, 230, 0.15)'
        };
      case 'mint':
        return {
          role: 'TREASURY DECIMALS HOST / COZY COINS SUPERINTENDENT',
          weapon: 'AMBIENT LO-FI WASHES & REVERB CHORDS',
          station: '33.3 FM',
          origin: 'DISTRICT D9 — MINT VAULT',
          energy: 'CALM / SOOTHING / ABSOLUTE COZINESS',
          quote: '“WE COUNT ON-CHAIN COINS IN EXACT MEASURES OF FOUR.”',
          cardTheme: 'border-[#5cfca9] text-[#5cfca9]',
          accentGlow: 'rgba(92, 252, 169, 0.15)'
        };
      case 'nexus':
        return {
          role: 'GLITCH SPECTRUM OVERLORD / HYPERPOP CATALYST',
          weapon: 'OVERCLOCKED SAWTOOTH SYNTHS & RESISTORS',
          station: '33.3 FM',
          origin: 'DISTRICT D5 — NEXUS HUB',
          energy: 'ELECTRIC / DYNAMIC CHAOS / HYPERACTIVE BOOST',
          quote: '“MASHING SAMPLES UNTIL CROWDS CANNOT DISTINGUISH DUST FROM DECIBELS.”',
          cardTheme: 'border-[#ec4899] text-[#ec4899]',
          accentGlow: 'rgba(236, 72, 153, 0.15)'
        };
      default:
        return {
          role: 'METADATA DIVINER / SPECTRUM BALANCE MONITOR',
          weapon: 'GENERATIVE MEDITATION DRONES',
          station: '33.3 FM',
          origin: 'DISTRICT D11 — ORACLE GRID',
          energy: 'TRANSCENDENT / SILENT / MEDITATIVE',
          quote: '“READING SYSTEM ENTROPY TO TUNE THE BROADCAST GRID LIVE.”',
          cardTheme: 'border-[#9945ff] text-[#9945ff]',
          accentGlow: 'rgba(153, 69, 255, 0.15)'
        };
    }
  };

  const meta = getProfileMetadata(artist.id);

  // Filter tracks matching this artist exactly
  const artistTracks = tracks.filter(t => t.artist.toLowerCase() === artist.name.toLowerCase());

  // Interactive Web Audio synthesis feedback effect
  const triggerAudioSqueak = (freq: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {}
  };

  // Action: Spend tip via window.XentsChange API
  const handleTip = () => {
    triggerAudioSqueak(659.3, 'triangle');
    if (!(window as any).XentsChange) {
      setSoundFeedback('◢ CHANGEMACHINE SYSTEM API OFFLINE!');
      setTimeout(() => setSoundFeedback(''), 1800);
      return;
    }

    (window as any).XentsChange.spend({
      amount: 100,
      label: `TIP SOVEREIGN VISUAL HOST: ${artist.name.toUpperCase()}`,
      category: 'tip',
      autoTopUp: true,
      onSuccess: () => {
        setSoundFeedback(`◢ TIP COMPLETED: SENT ⟁100 CREDITS!`);
        setTimeout(() => setSoundFeedback(''), 2500);
      }
    });
  };

  // Canvas-driven retro audio spectrum visualizer matching hyper-state dials
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle backing telemetry grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 12;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Live bar values derived from user dials!
      const totalBars = 22;
      const barWidth = canvas.width / totalBars - 2;
      const decayFactor = vocoderDecay / 100; // speeds up frequency sweep
      const hyperFactor = hyperCharge / 100; // raises bar heights
      const crackleNoise = frequencyCrackle / 8; // injects high-freq spikes

      for (let i = 0; i < totalBars; i++) {
        // Calculate interactive sine-wave height
        const waveSpeed = offset * (1.5 + decayFactor * 4);
        const baseHeight = Math.sin(i * 0.4 + waveSpeed) * (canvas.height * 0.4);
        const randomSpike = Math.random() * crackleNoise * 3;
        
        // Add extreme hyper level factors
        const totalHeight = Math.abs(baseHeight * (0.5 + hyperFactor * 1.5) + randomSpike);
        const clampedHeight = Math.min(canvas.height - 4, Math.max(2, totalHeight));

        // Color styling to match host's identity
        ctx.fillStyle = meta.cardTheme.includes('ff1a2e') 
          ? `rgba(255, 26, 46, ${0.4 + (clampedHeight / canvas.height) * 0.6})`
          : meta.cardTheme.includes('c2a633')
          ? `rgba(194, 166, 51, ${0.4 + (clampedHeight / canvas.height) * 0.6})`
          : meta.cardTheme.includes('00ffe6')
          ? `rgba(0, 255, 230, ${0.4 + (clampedHeight / canvas.height) * 0.6})`
          : meta.cardTheme.includes('5cfca9')
          ? `rgba(92, 252, 169, ${0.4 + (clampedHeight / canvas.height) * 0.6})`
          : meta.cardTheme.includes('ec4899')
          ? `rgba(236, 72, 153, ${0.4 + (clampedHeight / canvas.height) * 0.6})`
          : `rgba(153, 69, 255, ${0.4 + (clampedHeight / canvas.height) * 0.6})`;

        const xPos = i * (barWidth + 2);
        const yPos = canvas.height - clampedHeight;

        ctx.fillRect(xPos, yPos, barWidth, clampedHeight);

        // Draw top indicators
        if (clampedHeight > canvas.height * 0.7) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(xPos, yPos - 3, barWidth, 1.5);
        }
      }

      offset += 0.02;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [frequencyCrackle, vocoderDecay, hyperCharge, meta.cardTheme]);

  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. TOP HEADER NAVIGATION WITH SOUND CONTROL */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-orbitron font-extrabold text-xs text-neutral-400 hover:text-[#00ffe6] transition-colors cursor-pointer uppercase tracking-[0.15em]"
        >
          <ArrowLeft className="h-4 w-4 text-[#00ffe6]" /> ◤ DISMISS TO COHORT REGULATION
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              triggerAudioSqueak(440, 'sine');
            }}
            className="text-[9px] font-mono border border-neutral-800 bg-neutral-950 text-neutral-400 px-3 py-1 rounded hover:text-white transition-all hover:border-neutral-500 cursor-pointer"
          >
            {isMuted ? '● MUTED SPEAKER' : '● CABIN MONITOR ACTIVE'}
          </button>
          
          <span className="font-mono text-[9px] text-neutral-500">
            LOCALE TIME: <strong className="text-white">05:30:10 UTC</strong>
          </span>
        </div>
      </div>

      {/* 2. THREE-PANEL METRIC & SPECTRUM LAYOUT (MATCHING THE 4-QUADRANT TEMPLATE GRAPHICS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* PANEL A: ROTATING EMBLEM BADGE (MODELD AFTER TOP-LEFT BADGE) */}
        <div className="lg:col-span-4 border border-neutral-900 bg-black/40 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-neutral-950 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* Spinning outward orbit ring */}
            <motion.div
              style={{ border: `1px dashed ${meta.cardTheme.includes('ff1a2e') ? '#ff1a2e' : meta.cardTheme.includes('c2a633') ? '#c2a633' : '#00ffe6'}` }}
              className="absolute inset-0 rounded-full opacity-30"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            />
            {/* Inward dynamic indicator ring */}
            <motion.div
              style={{ border: `1.5px dotted ${meta.cardTheme.includes('ff1a2e') ? '#ffffff' : meta.cardTheme.includes('c2a633') ? '#c2a633' : '#00ffe6'}` }}
              className="absolute inset-4 rounded-full opacity-45"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            />

            {/* Glowing avatar frame centerpiece */}
            <div className="z-10 relative">
              <CyberAvatar artistId={artist.id} size="xl" isAnimated={true} />
            </div>

            {/* Dynamic radar scanning laser line */}
            <motion.div
              className="absolute inset-y-0 left-1/2 w-[1px] origin-center z-10 opacity-30"
              style={{
                background: `linear-gradient(to top, transparent, ${meta.cardTheme.includes('ff1a2e') ? '#ff1a2e' : '#00ffe6'}, transparent)`
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            />
          </div>

          <div className="mt-5 text-center z-10">
            <h3 className="font-orbitron font-extrabold text-[#fff] tracking-[0.25em] text-sm uppercase">
              {artist.name} SPECIMEN
            </h3>
            <p className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest mt-1">
              ◤ WIRED SPECTRUM CITIZEN ◢
            </p>
          </div>
        </div>

        {/* PANEL B: THE SOVEREIGN STATS CARD (MODELED EXACTLY ON BOTTOM-RIGHT CARD TEMPLATE) */}
        <div 
          className={`lg:col-span-4 border-2 ${meta.cardTheme} bg-neutral-950/90 rounded-2xl p-6 md:p-7 flex flex-col justify-between relative shadow-2xl overflow-hidden`}
          style={{ boxShadow: `0 0 45px ${meta.accentGlow}` }}
        >
          {/* Laser scanning top line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />

          <div>
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-5">
              <span className="font-orbitron font-black text-xs tracking-widest uppercase">
                ◢ {artist.name} PROFILE
              </span>
              <span className="font-orbitron font-extrabold text-[9px] tracking-widest text-[#fff] uppercase">
                SYS ID: 33.3_SECTOR
              </span>
            </div>

            {/* Structured Specifications Grid */}
            <div className="flex flex-col gap-3.5 font-mono text-[10.5px]">
              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  ALIAS:
                </span>
                <span className="font-orbitron font-bold text-white uppercase">{artist.name}</span>
              </div>

              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  ROLE:
                </span>
                <span className="text-neutral-300 uppercase leading-relaxed">{meta.role}</span>
              </div>

              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  WEAPON / HARDWARE:
                </span>
                <span className="text-neutral-300 uppercase leading-relaxed">{meta.weapon}</span>
              </div>

              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  STATION & CONSOLE:
                </span>
                <span className="text-white uppercase font-bold">{meta.station}</span>
              </div>

              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  ORIGIN / HABITAT SECURE:
                </span>
                <span className="text-neutral-400 uppercase">{meta.origin}</span>
              </div>

              <div>
                <span className="text-neutral-500 text-[8.5px] uppercase block tracking-wider leading-none mb-1">
                  ATMOSPHERIC ENERGY VIBEARM:
                </span>
                <span className="text-[#c2a633] font-bold uppercase">{meta.energy}</span>
              </div>
            </div>
          </div>

          {/* Styled quote section with gorgeous bounding boxes */}
          <div className="mt-8 pt-4 border-t border-neutral-900/80">
            <p className="text-xs text-white leading-relaxed italic text-center font-sans tracking-wide">
              {meta.quote}
            </p>
          </div>
        </div>

        {/* PANEL C: CHROME BROADCAST CABIN DECK (MODELED AFTER BOTTOM-LEFT CHROME DECK WITH LIVE SINE WAVE) */}
        <div className="lg:col-span-4 border border-neutral-800 bg-[#060607] rounded-xl p-5 flex flex-col justify-between relative">
          
          <div>
            {/* Header with Live Broadcast Indicator */}
            <div className="flex justify-between items-center border-b border-neutral-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#ff1a2e] animate-ping" />
                <span className="font-orbitron font-black text-xs text-white tracking-widest uppercase">
                  ◢ CABIN BROADCAST BOOTH
                </span>
              </div>
              
              <span className="text-[9px] bg-red-950/60 text-red-500 border border-red-900 font-black px-2 py-0.5 rounded tracking-widest animate-pulse">
                ON AIR
              </span>
            </div>

            {/* Interactive sliders layout */}
            <div className="flex flex-col gap-4 font-mono text-[10px] text-neutral-400 mb-5">
              <span>◢ TELEMETRY SIGNAL MODIFIERS:</span>
              
              {/* slider 1 */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span>FREQUENCY CRACKLE:</span>
                  <span className="text-[#00ffe6]">{frequencyCrackle} Hz</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={frequencyCrackle}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFrequencyCrackle(val);
                    triggerAudioSqueak(150 + val * 4, 'sine');
                  }}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#ff1a2e]"
                />
              </div>

              {/* slider 2 */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span>VOCODER DECAY SPEED:</span>
                  <span className="text-[#00ffe6]">{vocoderDecay} ms</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={vocoderDecay}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVocoderDecay(val);
                    triggerAudioSqueak(220 + val * 2, 'triangle');
                  }}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#c2a633]"
                />
              </div>

              {/* slider 3 */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span>HYPER CHARGE DUMP STATE:</span>
                  <span className="text-[#00ffe6]">{hyperCharge} %</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={hyperCharge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHyperCharge(val);
                    triggerAudioSqueak(350 + val * 3, 'sawtooth');
                  }}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#00ffe6]"
                />
              </div>
            </div>
          </div>

          {/* HTML5 Canvas driven visual audio bar loop display! */}
          <div className="h-28 bg-black/80 rounded border border-neutral-900 relative overflow-hidden flex flex-col justify-end p-1.5">
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={100} 
              className="w-full h-full block"
            />
            {/* HUD Scan overlays */}
            <div className="absolute inset-x-0 top-1 px-2 flex justify-between font-mono text-[8px] text-neutral-500 pointer-events-none uppercase">
              <span>SCANRATE: 44.1 KHZ</span>
              <span>STATE: ACTIVE</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleTip}
              className="flex-1 py-3 bg-[#c2a633] hover:bg-yellow-500 border border-[#c2a633] text-black font-orbitron font-black text-xs tracking-widest transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
            >
              ◤ TIP ⟁ 100 CREDITS
            </button>
            <button
              onClick={() => onNavigate('mint')}
              className="px-4 border border-neutral-800 hover:border-white text-neutral-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Mint release on portal"
            >
              <Cpu className="h-4 w-4" />
            </button>
          </div>

          {/* Toast feedback text on-screen */}
          <AnimatePresence>
            {soundFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-5 bg-black border border-[#00ffe6] text-[#00ffe6] font-mono text-[10px] py-2 px-3 text-center rounded shadow-2xl z-40 animate-pulse tracking-wide"
              >
                {soundFeedback}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* 3. METRIC TICKER FOR SECONDARY TELEMETRIES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[#00ffe6]">
        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-xl text-center shadow">
          <span className="font-orbitron font-bold text-[9px] text-neutral-500 block mb-1 uppercase tracking-wider">
            SPECTRUM PLAYS
          </span>
          <span className="font-mono text-xl font-bold">{artist.stats.plays.toLocaleString()}</span>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-xl text-center shadow">
          <span className="font-orbitron font-bold text-[9px] text-neutral-500 block mb-1 uppercase tracking-wider">
            RESONANT LISTENERS
          </span>
          <span className="font-mono text-xl font-bold">{artist.stats.listeners.toLocaleString()}</span>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-xl text-center shadow">
          <span className="font-orbitron font-bold text-[9px] text-neutral-500 block mb-1 uppercase tracking-wider">
            MINTED RELEASES
          </span>
          <span className="font-mono text-xl font-bold">{artist.stats.releases}</span>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-xl text-center shadow">
          <span className="font-orbitron font-bold text-[9px] text-neutral-500 block mb-1 uppercase tracking-wider">
            CO-ON-CHAIN OWNERSHIP
          </span>
          <span className="font-mono text-xs font-black text-[#c2a633] tracking-widest block py-1 uppercase bg-[#c2a633]/5 border border-[#c2a633]/20 rounded mt-0.5">
            100% SOVEREIGN
          </span>
        </div>
      </div>

      {/* 4. RELEASES ROTATION LIST */}
      <div className="border border-neutral-900 bg-black/60 p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-xs text-neutral-400 border-b border-neutral-900 pb-2.5 mb-4 uppercase tracking-widest">
          ◢ CHANNELS / INGESTED ROTATIONS
        </h3>

        {artistTracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {artistTracks.map((track, idx) => (
              <div
                key={idx}
                className="p-3.5 border border-neutral-900/80 hover:border-neutral-800 bg-neutral-950/40 rounded-xl flex justify-between items-center text-xs font-mono group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Disc className="h-4 w-4 text-[#00ffe6] group-hover:animate-spin" style={{ animationDuration: '4s' }} />
                  <div>
                    <span className="font-bold text-white uppercase group-hover:text-[#00ffe6] transition-colors">{track.title}</span>
                    <div className="mt-1 flex gap-3 text-[9px] text-neutral-500">
                      <span>{track.bpm} BPM</span>
                      <span>KEY: {track.key}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[8px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded font-black">
                    {track.chain.toUpperCase()} CONTRACT
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 border border-dashed border-neutral-900 rounded-xl text-center text-neutral-500 font-mono text-xs leading-relaxed">
            ◢ NO LIVE ROTATION INGESTED IN MASTER SPECTRUM YET ◣
            <button
              onClick={() => onNavigate('mint')}
              className="mt-4 block mx-auto py-2 px-4 bg-[#00ffe6] text-black font-orbitron font-bold text-[10px] hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              MINT FIRST SOVEREIGN TRACK NOW
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
