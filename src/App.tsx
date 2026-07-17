/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Cpu,
  User,
  Activity,
  Coins,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Eye,
  Smartphone,
  Tv,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ensureSeed } from './utils/seed';
import { Artist, OacRelease, RadioTrack, Show } from './types';

// Import Views
import BroadcastView from './components/BroadcastView';
import MintView from './components/MintView';
import CatalogView from './components/CatalogView';
import StudioView from './components/StudioView';
import ArtistView from './components/ArtistView';
import XentsWidget from './components/XentsWidget';

// ----------------------
// USER AUTH & MOTION COMPONENT IMPORTS
// ----------------------
import AuthModal from './components/AuthModal';
import MotionDashboardDemo from './components/MotionDashboardDemo';
import GlobalSearch from './components/GlobalSearch';
import TalkshowView from './components/TalkshowView';
import { 
  isFirebaseConfigured, 
  auth as firebaseAuth, 
  getLocalSession, 
  setLocalSession, 
  UserSession 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<'brand' | 'broadcast' | 'mint' | 'catalog' | 'artist' | 'studio' | 'motion' | 'talkshow'>('brand');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  
  // Storage synchronized states
  const [artists, setArtists] = useState<Artist[]>([]);
  const [releases, setReleases] = useState<OacRelease[]>([]);
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [schedule, setSchedule] = useState<Show[]>([]);
  const [balance, setBalance] = useState<number>(0);

  // User Authentication dynamic state mappings
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Brand Center States
  const [activeBannerMode, setActiveBannerMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Documentary trailer state manager
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerIndex, setTrailerIndex] = useState(-1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const staticNodeRef = useRef<AudioNode | null>(null);

  // Seed and load database
  useEffect(() => {
    ensureSeed();
    loadFromLocalStorage();

    const handleStorage = () => {
      loadFromLocalStorage();
    };
    window.addEventListener('storage', handleStorage);

    // If real Firebase is configured, assign the direct listener
    let unsubscribe: any = null;
    if (isFirebaseConfigured && firebaseAuth) {
      unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        if (firebaseUser) {
          const session: UserSession = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            isMock: false
          };
          setUser(session);
          setLocalSession(session);
        } else {
          const current = getLocalSession();
          if (current && !current.isMock) {
            setUser(null);
            setLocalSession(null);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const art = JSON.parse(localStorage.getItem('wc_artists') || '[]');
      const rel = JSON.parse(localStorage.getItem('wc_oac_releases') || '[]');
      const trk = JSON.parse(localStorage.getItem('wc_radio_tracks') || '[]');
      const sch = JSON.parse(localStorage.getItem('wc_radio_schedule') || '[]');
      const b = Number(localStorage.getItem('wc_xents_balance') || 0);
      const userSes = getLocalSession();

      setArtists(art);
      setReleases(rel);
      setTracks(trk);
      setSchedule(sch);
      setBalance(b);
      setUser(userSes);
    } catch (e) {
      console.error('Error loading localized storage:', e);
    }
  };

  // Web Audio Noise Generator for Radio Atmosphere
  const toggleSound = () => {
    if (soundEnabled) {
      if (staticNodeRef.current) {
        try { staticNodeRef.current.disconnect(); } catch (e) {}
        staticNodeRef.current = null;
      }
      setSoundEnabled(false);
    } else {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        // Generate Pink-ish Radio Noise Code
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // Volume compensation
          b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        // Bandpass Filter to sound like atmospheric radio
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 1.0;

        // Low volume hum
        const volumeGain = ctx.createGain();
        volumeGain.gain.value = 0.04;

        source.connect(filter);
        filter.connect(volumeGain);
        volumeGain.connect(ctx.destination);

        source.start(0);
        staticNodeRef.current = source;
        setSoundEnabled(true);
      } catch (err) {
        console.warn('Audio synthesis neglected:', err);
      }
    }
  };

  // Documentary Trailer Step Playback Logic
  useEffect(() => {
    if (!trailerPlaying) return;

    const sequence = [
      { delay: 3000 }, // Black screen static intro (Index 0)
      { delay: 3500 }, // Single red light caption 1 (Index 1)
      { delay: 3500 }, // Caption 2 (Index 2)
      { delay: 4000 }, // Cut to rain city (Index 3)
      { delay: 4000 }, // Caption "Some call it music..." (Index 4)
      { delay: 4000 }, // Montage montage (Index 5)
      { delay: 4000 }, // Caption "This isn't radio..." (Index 6)
      { delay: 4000 }, // End Card 33.3 (Index 7)
    ];

    const runSequence = (idx: number) => {
      if (idx >= sequence.length) {
        setTrailerPlaying(false);
        setTrailerIndex(-1);
        return;
      }
      setTrailerIndex(idx);
      setTimeout(() => {
        runSequence(idx + 1);
      }, sequence[idx].delay);
    };

    runSequence(0);
  }, [trailerPlaying]);

  // Handle navigate helper
  const navigateTo = (view: 'brand' | 'broadcast' | 'mint' | 'catalog' | 'artist' | 'studio' | 'motion' | 'talkshow', id?: string) => {
    if (view === 'artist' && id) {
      setSelectedArtistId(id);
    }
    setCurrentView(view);
  };

  // Trigger Change Machine modal open helper
  const handleOpenXents = () => {
    if ((window as any).XentsChange) {
      (window as any).XentsChange.open();
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-neutral-200 flex flex-col font-mono selection:bg-[#ff1a2e] selection:text-white relative">
      
      {/* Global Background Particles / Telemetry Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#15151b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />
      
      {/* HEADER BAR NETWORK METRICS */}
      <header className="border-b border-neutral-900 bg-black/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('brand')}
            className="flex items-center gap-2 text-[#ff1a2e] font-black tracking-widest text-xs select-none hover:opacity-85 cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#ff1a2e] animate-ping" />
            33.3FM DOGECHAIN
          </button>
          
          <div className="hidden lg:flex items-center gap-3 border-l border-neutral-800 pl-4 text-[9px] text-neutral-500 tracking-wider">
            <span>NET STATUS: <strong className="text-emerald-400">ACTIVE</strong></span>
            <span>CAPACITY: <strong className="text-white">33.3 Mbps</strong></span>
            <span>CITIZENS ON-MIC: <strong className="text-[#00ffe6]">{artists.length}</strong></span>
            {user && (
              <span className="border-l border-neutral-800 pl-3">AGENT UPLINK: <strong className="text-[#00ffe6]">{user.displayName || user.email.split('@')[0]}</strong></span>
            )}
          </div>
        </div>

        {/* GLOBAL COGNITIVE SEARCH ENGINE */}
        <div className="hidden md:block flex-grow max-w-xs xl:max-w-sm mx-4 lg:mx-8">
          <GlobalSearch
            artists={artists}
            releases={releases}
            tracks={tracks}
            onNavigate={(v, id) => navigateTo(v as any, id)}
            onOpenXents={handleOpenXents}
          />
        </div>

        {/* Balance & Trigger Box */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenXents}
            className="flex items-center gap-2 border border-neutral-800 bg-[#c2a633]/5 hover:bg-[#c2a633]/15 text-[#c2a633] px-3 py-1.5 rounded font-orbitron text-[10px] font-extrabold tracking-widest leading-none border-[#c2a633]/40 hover:border-[#c2a633]/80 transition-all cursor-pointer shadow-[0_0_12px_rgba(194,166,51,0.05)]"
          >
            <Coins className="h-3.5 w-3.5 text-[#00ffe6]" />
            ⟁ {balance.toLocaleString()} CREDITS
          </button>

          {/* User Profile Hook */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded font-orbitron text-[10px] font-extrabold tracking-widest transition-all cursor-pointer ${
              user 
                ? "bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6] hover:bg-[#00ffe6]/20 shadow-[0_0_12px_rgba(0,255,230,0.15)]" 
                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {user ? `${(user.displayName || user.email.split('@')[0]).toUpperCase()} // ONLINE` : "AUTHENTICATE NODE"}
          </button>
        </div>
      </header>

      {/* VIEW SELECTOR SUB-NAVIGATION BAR */}
      <nav className="bg-neutral-950 border-b border-neutral-900/60 px-4 md:px-8 py-1.5 overflow-x-auto flex gap-1 z-40 scrollbar-thin">
        <button
          onClick={() => navigateTo('brand')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'brand'
              ? 'bg-[#ff1a2e]/10 border-[#ff1a2e] text-[#ff1a2e]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Activity className="h-3 w-3" /> THE SIGNAL (BRAND HUB)
        </button>

        <button
          onClick={() => navigateTo('broadcast')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'broadcast'
              ? 'bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Radio className="h-3 w-3" /> BROADCAST DECK
        </button>

        <button
          onClick={() => navigateTo('mint')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'mint'
              ? 'bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Cpu className="h-3 w-3" /> OAC RELEASE PORTAL
        </button>

        <button
          onClick={() => navigateTo('catalog')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'catalog' || currentView === 'artist'
              ? 'bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <User className="h-3 w-3" /> CITIZENS CATALOG
        </button>

        <button
          onClick={() => navigateTo('studio')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'studio'
              ? 'bg-[#c2a633]/15 border-[#c2a633] text-[#c2a633]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Sparkles className="h-3 w-3" /> STUDIO CONSOLE
        </button>

        <button
          onClick={() => navigateTo('talkshow')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'talkshow'
              ? 'bg-[#ff1a2e]/15 border-[#ff1a2e] text-[#ff1a2e]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Radio className="h-3 w-3 text-red-500" /> AI TALKSHOW
        </button>

        <button
          onClick={() => navigateTo('motion')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer border rounded-md transition-all ${
            currentView === 'motion'
              ? 'bg-[#00f5ff]/15 border-[#00f5ff] text-[#00f5ff]'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
          }`}
        >
          <Sparkles className="h-3 w-3 text-[#ff0055]" /> MOTION CORE
        </button>
      </nav>

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 px-4 md:px-8 py-8 md:py-10 max-w-7xl w-full mx-auto relative z-10">
        
        {currentView === 'brand' && (
          <div className="flex flex-col gap-10">
            
            {/* BRAND HERO LANDING PANEL */}
            <div className="relative overflow-hidden border-2 border-neutral-900 bg-gradient-to-b from-neutral-950 to-black p-6 md:p-12 rounded-2xl shadow-[0_0_80px_rgba(255,26,46,0.06)] flex flex-col md:flex-row gap-8 items-center">
              
              {/* Dynamic 3D CSS Audio Shield Logo on the left */}
              <div className="md:w-2/5 flex flex-col items-center justify-center relative">
                <div className="relative w-60 h-60 flex items-center justify-center">
                  
                  {/* Rotating orbital energy lines */}
                  <div className="absolute inset-0 border border-dashed border-[#ff1a2e]/30 rounded-full animate-spin" style={{ animationDuration: '24s' }} />
                  <div className="absolute inset-6 border border-neutral-800 rounded-full animate-pulse" />
                  <div className="absolute inset-10 border border-dotted border-[#00ffe6]/25 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />

                  {/* 3D Visual Shield Card */}
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border-3 border-[#ff1a2e] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,26,46,0.3)] hover:scale-105 hover:border-[#00ffe6] hover:shadow-[0_0_50px_rgba(0,255,230,0.2)] transition-all cursor-pointer group">
                    <span className="font-orbitron font-extrabold text-[#fff] tracking-tight text-4xl group-hover:text-[#00ffe6] transition-colors leading-none drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                      33.3
                    </span>
                    <span className="font-orbitron font-black text-red-600 group-hover:text-white transition-colors tracking-[0.25em] text-sm mt-1 uppercase">
                      FM
                    </span>
                    <span className="mt-4 font-mono text-[7px] text-[#c2a633] tracking-[0.3em] font-bold group-hover:scale-105 transition-all">
                      ◤ BRAND SIGN ◢
                    </span>
                  </div>

                  {/* Red energy signal rings expanding */}
                  <div className="absolute h-48 w-48 rounded-full border-2 border-[#ff1a2e] opacity-15 animate-ping" style={{ animationDuration: '3.5s' }} />
                </div>
                
                <div className="mt-4 text-center">
                  <h3 className="font-orbitron font-extrabold text-xs text-[#ff1a2e] tracking-[0.3em] uppercase">
                    33.3 FM 3D EMBLEM
                  </h3>
                  <p className="font-mono text-[9px] text-neutral-500 mt-1 uppercase tracking-widest">
                    THE SIGNAL BITES BACK
                  </p>
                </div>
              </div>

              {/* High-end Apple-level web visual copy center on the right */}
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <div className="inline-flex mx-auto md:mx-0 items-center gap-2 bg-[#ff1a2e]/10 border border-[#ff1a2e]/40 px-3 py-1 rounded text-[#ff1a2e] font-orbitron text-[9px] tracking-widest uppercase mb-4 w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff1a2e] animate-ping" />
                  WIRED CHAOS MEDIA UPLINK
                </div>
                
                <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white leading-tight uppercase tracking-tight">
                  THE SIGNAL <br/>
                  <span className="text-[#ff1a2e] drop-shadow-[0_0_15px_rgba(255,26,46,0.3)]">BITES BACK</span>
                </h1>
                
                <p className="mt-4 font-mono text-xs md:text-sm text-neutral-400 max-w-xl leading-relaxed">
                  33.3 FM is where culture, stories, frequencies, music, and hidden transmissions converge. Powered by sovereign agent DJs, multi-chain royalty splits, and Open Agentic Commerce.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <button
                    onClick={() => navigateTo('broadcast')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#ff1a2e] hover:bg-[#ff1a2e]/80 text-white font-orbitron font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,26,46,0.35)] active:translate-y-0.5"
                  >
                    ENTER THE BROADCAST <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigateTo('broadcast')}
                    className="w-full sm:w-auto px-6 py-3.5 border border-neutral-700 hover:border-white text-white font-orbitron font-bold text-xs tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    LISTEN LIVE
                  </button>
                </div>

                {/* Animated interactive elements preview line */}
                <div className="mt-8 border-t border-neutral-900 pt-4 flex gap-6 text-[9px] text-[#00ffe6]/80 font-mono tracking-wider justify-center md:justify-start">
                  <span>● NEON FANG ACTIVE</span>
                  <span>● 100% SOVEREIGN DATA</span>
                  <span>● $XENTS CONVERGENCE</span>
                </div>
              </div>
            </div>

            {/* CINEMATIC TRAILER & BANNER PREVIEW SECTION CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT: Atmospheric documentary trailer player client */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="border border-neutral-800 bg-[#060607] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                  
                  {/* Decorative noise bars */}
                  <div className="absolute top-4 right-4 flex items-center gap-3">
                    <button
                      onClick={toggleSound}
                      className={`flex h-7 w-7 items-center justify-center border rounded-full transition-all cursor-pointer ${
                        soundEnabled
                          ? 'bg-[#ff1a2e]/20 border-[#ff1a2e] text-[#ff1a2e] animate-pulse'
                          : 'border-neutral-800 text-neutral-500 hover:text-white'
                      }`}
                      title={soundEnabled ? 'Mute Atmosphere' : 'Enable Atmosphere Noise'}
                    >
                      {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    </button>
                    <span className="font-mono text-[8px] text-[#ff1a2e] bg-[#ff1a2e]/10 border border-[#ff1a2e]/30 px-2 py-0.5 rounded tracking-widest">
                      AUDIO MONITORS LIVE
                    </span>
                  </div>

                  <div className="border-b border-neutral-900 pb-2.5 mb-4">
                    <h3 className="font-orbitron font-extrabold text-xs text-white tracking-widest uppercase">
                      ◤ DOCUMENTARY ORIGIN TRAILER
                    </h3>
                    <p className="font-mono text-[9px] text-[#ff1a2e] mt-1">THE VOICE BEHIND 33.3 FM — DJ RED FANG</p>
                  </div>

                  {/* Simulator Screen Console */}
                  <div className="flex-1 bg-black p-4 md:p-6 rounded border border-neutral-900 flex flex-col justify-center items-center relative overflow-hidden min-h-[220px]">
                    <div className="absolute inset-0 bg-[#ff001c]/[0.02] bg-[radial-gradient(#ff1a2e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                      {/* Black Screen Static */}
                      {trailerIndex === 0 && (
                        <motion.div
                          key="static"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <div className="h-10 w-10 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 animate-spin">
                            ⚡
                          </div>
                          <span className="text-xs text-red-600 font-bold tracking-widest animate-pulse">
                            [ MICROPHONE STATIC CRACKLE / RADIO humS ]
                          </span>
                        </motion.div>
                      )}

                      {/* Line 1 Caption */}
                      {trailerIndex === 1 && (
                        <motion.div
                          key="line1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <span className="text-[10px] text-[#c2a633] block mb-2 font-black uppercase tracking-[0.2em]">
                            ◉ DJ RED FANG (V.O.)
                          </span>
                          <p className="text-lg font-orbitron font-extrabold text-white tracking-wide max-w-sm mx-auto leading-relaxed italic">
                            “Every city has a frequency…”
                          </p>
                        </motion.div>
                      )}

                      {/* Line 2 Caption */}
                      {trailerIndex === 2 && (
                        <motion.div
                          key="line2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <span className="text-[10px] text-[#c2a633] block mb-2 font-black uppercase tracking-[0.2em]">
                            ◉ DJ RED FANG (V.O.)
                          </span>
                          <p className="text-lg font-orbitron font-extrabold text-white tracking-wide max-w-sm mx-auto leading-relaxed italic">
                            “Most people never hear it.”
                          </p>
                        </motion.div>
                      )}

                      {/* City View Visual Simulation */}
                      {trailerIndex === 3 && (
                        <motion.div
                          key="city"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center w-full"
                        >
                          <div className="text-[9px] bg-red-950/40 text-red-400 border border-red-900 px-3 py-1 rounded inline-block mb-3 select-none">
                            ◉ CUT TO NEON CITY [RAIN]
                          </div>
                          <p className="text-xs text-neutral-400 max-w-xs mx-auto italic font-mono leading-relaxed">
                            Red signals moving continuously between obsidian-glass monoliths.
                          </p>
                        </motion.div>
                      )}

                      {/* Line 4 Caption */}
                      {trailerIndex === 4 && (
                        <motion.div
                          key="line4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <p className="text-base font-orbitron font-extrabold text-white max-w-md leading-relaxed">
                            “Some call it music… <br/>
                            Some call it rebellion… <br/>
                            <span className="text-[#ff1a2e] block mt-1 uppercase text-lg tracking-[0.2em] font-black drop-shadow-[0_0_8px_rgba(255,26,46,0.5)]">
                              I call it truth.
                            </span>”
                          </p>
                        </motion.div>
                      )}

                      {/* Fast Montage */}
                      {trailerIndex === 5 && (
                        <motion.div
                          key="montage"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center grid grid-cols-3 gap-2"
                        >
                          <div className="border border-neutral-900 p-2.5 rounded bg-neutral-950 font-mono text-[9px]">
                            💿 VINYL SPINNING
                          </div>
                          <div className="border border-neutral-900 p-2.5 rounded bg-neutral-950 font-mono text-[9px]">
                            📡 TRANSMISSION TOWERS
                          </div>
                          <div className="border border-neutral-900 p-2.5 rounded bg-neutral-950 font-mono text-[9px]">
                            🔊 ROOFTOP SIGS
                          </div>
                        </motion.div>
                      )}

                      {/* Line 6 */}
                      {trailerIndex === 6 && (
                        <motion.div
                          key="line6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <p className="text-lg font-orbitron font-extrabold text-white max-w-xs leading-relaxed italic">
                            “This isn’t radio… <br/>
                            <span className="text-[#00ffe6]">this is a signal.</span> <br/>
                            And once you hear it… you can't unhear it.”
                          </p>
                        </motion.div>
                      )}

                      {/* End Card */}
                      {trailerIndex === 7 && (
                        <motion.div
                          key="end"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <h4 className="font-orbitron font-black text-white text-3xl tracking-widest uppercase">
                            33.3 <span className="text-[#ff1a2e]">FM</span>
                          </h4>
                          <p className="mt-1 font-orbitron font-extrabold text-xs tracking-widest text-[#c2a633] uppercase">
                            THE SIGNAL BITES BACK
                          </p>
                          <div className="mt-4 text-[9px] font-mono text-neutral-500 tracking-[0.4em] uppercase">
                            COMING SOON / END TRANSMISSION
                          </div>
                        </motion.div>
                      )}

                      {/* Inactive Neutral Screen */}
                      {trailerIndex === -1 && (
                        <motion.div
                          key="inactive"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center flex flex-col items-center"
                        >
                          <div className="relative h-14 w-14 rounded-full border-2 border-[#ff1a2e]/40 flex items-center justify-center animate-pulse mb-3 bg-neutral-950 group-hover:border-[#ff1a2e]">
                            <Play className="h-5 w-5 text-[#ff1a2e] translate-x-0.5" />
                          </div>
                          <span className="text-xs font-orbitron text-neutral-500 tracking-widest uppercase">
                            ACTIVATE TRAILER SEQUENCE
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-neutral-900 pt-3 flex items-center justify-between">
                    <button
                      onClick={() => setTrailerPlaying(prev => !prev)}
                      className={`py-2 px-5 font-orbitron font-bold text-[10px] tracking-widest text-black flex items-center gap-2 transition-colors cursor-pointer ${
                        trailerPlaying ? 'bg-[#c2a633] border-[#c2a633]' : 'bg-[#fff] border-white hover:bg-neutral-200'
                      }`}
                    >
                      {trailerPlaying ? (
                        <>
                          <Pause className="h-3 w-3" /> STOP SEQUENCE
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" /> INITIATE ORIGIN TRAILER
                        </>
                      )}
                    </button>

                    <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                      EPISODE: D7_FACE_REBEL
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: High-end Banner customizer preview */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="border border-neutral-800 bg-[#060607] rounded-xl p-5 flex flex-col gap-4 h-full justify-between">
                  
                  <div>
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5 mb-3">
                      <span className="font-orbitron font-extrabold text-xs text-white tracking-widest uppercase">
                        ◤ PLATFORM LAYOUT BANNER
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setActiveBannerMode('desktop')}
                          className={`p-1 border rounded cursor-pointer transition-all ${
                            activeBannerMode === 'desktop' ? 'bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6]' : 'border-neutral-800 text-neutral-500 hover:text-white'
                          }`}
                        >
                          <Tv className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setActiveBannerMode('mobile')}
                          className={`p-1 border rounded cursor-pointer transition-all ${
                            activeBannerMode === 'mobile' ? 'bg-[#00ffe6]/10 border-[#00ffe6] text-[#00ffe6]' : 'border-neutral-800 text-neutral-500 hover:text-white'
                          }`}
                        >
                          <Smartphone className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="font-mono text-[10px] text-neutral-400 leading-normal mb-4">
                      Explore the live-rendered ultra-wide cinematic banner optimized for X accounts or YouTube channels, framing DJ Red Fang overlooking D7 sector.
                    </p>
                  </div>

                  {/* Banner Canvas Representation */}
                  <div className={`relative transition-all border border-neutral-900 bg-neutral-950 overflow-hidden ${
                    activeBannerMode === 'mobile' ? 'aspect-[3/2] max-w-[280px] mx-auto' : 'aspect-[3/1]'
                  }`}>
                    {/* Background Cyber skyline representation */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ff1a2e]/10 to-transparent pointer-events-none" />
                    
                    {/* Glowing neon signboard centered overlay */}
                    <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center text-center px-2 select-none">
                      <span className="font-orbitron font-black text-[#fff] tracking-tighter text-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]">
                        33.3 FM
                      </span>
                      <span className="font-orbitron text-[6px] tracking-[0.25em] text-[#ff1a2e] uppercase font-bold">
                        THE VOICE OF THE UNDERGROUND
                      </span>
                      <span className="font-mono text-[5px] text-neutral-500 uppercase tracking-[0.3em] mt-1.5">
                        ◤ TUNE INTO THE SIGNAL ◢
                      </span>
                    </div>

                    {/* Radio wave indicators in background Grid */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                      <span className="font-mono text-[5px] text-neutral-500 uppercase">SIGNAL LOCK</span>
                    </div>

                    <div className="absolute inset-0 bg-[radial-gradient(#ff1a2e_1px,transparent_1px)] [background-size:12px_12px] opacity-10" />
                  </div>

                  {/* Positioning specs */}
                  <div className="border-t border-neutral-900 pt-4 flex justify-between items-center text-[9px] text-neutral-500 uppercase">
                    <span>◢ POSITIONING: HIGH COHERENCE</span>
                    <span>SIZE: 1500 X 500 PX</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB VIEWS INJECTOR PANEL */}
        {currentView === 'broadcast' && (
          <BroadcastView
            onNavigate={(v, id) => navigateTo(v as any, id)}
            artists={artists}
            tracks={tracks}
            schedule={schedule}
            setTracks={setTracks}
            setArtists={setArtists}
          />
        )}

        {currentView === 'mint' && (
          <MintView
            onNavigate={(v, id) => navigateTo(v as any, id)}
            artists={artists}
            releases={releases}
            setReleases={setReleases}
            setTracks={setTracks}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            onNavigate={(v, id) => navigateTo(v as any, id)}
            artists={artists}
            releases={releases}
          />
        )}

        {currentView === 'artist' && (
          <ArtistView
            artistId={selectedArtistId}
            artists={artists}
            tracks={tracks}
            onBack={() => navigateTo('catalog')}
            onNavigate={(v, id) => navigateTo(v as any, id)}
          />
        )}

        {currentView === 'studio' && (
          <StudioView
            onNavigate={(v, id) => navigateTo(v as any, id)}
            artists={artists}
            tracks={tracks}
            schedule={schedule}
            setTracks={setTracks}
            setSchedule={setSchedule}
          />
        )}

        {currentView === 'motion' && (
          <MotionDashboardDemo />
        )}

        {currentView === 'talkshow' && (
          <TalkshowView
            artists={artists}
            releases={releases}
            setReleases={setReleases}
            setTracks={setTracks}
            balance={balance}
            setBalance={setBalance}
          />
        )}

      </main>

      {/* FLOAT CHANGE MACHINE DIAL */}
      <XentsWidget />

      {/* FOOTER CO-REGULATIONS */}
      <footer className="border-t border-neutral-900 bg-[#020203] py-6 px-4 md:px-8 text-center text-neutral-600 text-[10px] uppercase font-mono tracking-widest mt-auto">
        <div>33.3 FM · DECENTRALIZED BROADCAST LAYER OF WIRED CHAOS ECOSYSTEM</div>
        <div className="text-[#c2a633] mt-1">OPEN AGENTIC COMMERCE SECURED DECIMALS VIA DOGECHAIN</div>
      </footer>

      {/* AUTHENTICATION OVERLAY PORTALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUserChange={(newUser) => {
          setUser(newUser);
          loadFromLocalStorage();
        }}
      />
    </div>
  );
}
