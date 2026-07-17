/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  Radio, 
  Volume2, 
  Flame, 
  Heart, 
  Share2, 
  Compass, 
  AlertCircle,
  MessageSquare,
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { Artist, RadioTrack, Show } from '../types';

// Pre-set reaction emojis for instant signal boosts
const PRESET_EMOJIS = ['👍', '❤️', '🔥', '🤯', '🎶', '⚡'];

// Curated selection of futuristic listener personas
const MOCK_LISTENERS = [
  { user: '@neon_circuit', avatarColor: 'bg-cyan-500 border border-cyan-400' },
  { user: '@cyber_nomad', avatarColor: 'bg-emerald-500 border border-emerald-400' },
  { user: '@hologram_rider', avatarColor: 'bg-fuchsia-500 border border-fuchsia-400' },
  { user: '@pixel_shifter', avatarColor: 'bg-amber-500 border border-amber-400' },
  { user: '@quantum_dj', avatarColor: 'bg-rose-500 border border-rose-400' },
  { user: '@null_pointer_exc', avatarColor: 'bg-teal-500 border border-teal-400' },
  { user: '@bit_corsair', avatarColor: 'bg-blue-500 border border-blue-400' },
  { user: '@rebel_freq', avatarColor: 'bg-purple-500 border border-purple-400' },
  { user: '@glitch_vortex', avatarColor: 'bg-red-500 border border-red-400' },
  { user: '@ether_drift', avatarColor: 'bg-sky-400 border border-sky-300' },
  { user: '@synthetic_solace', avatarColor: 'bg-indigo-500 border border-indigo-400' },
  { user: '@vector_ghost', avatarColor: 'bg-pink-500 border border-pink-400' },
];

const CURATED_COMMENTS = [
  'This track hitting different on my auditory synth neural receptors! ⚡',
  'District 7 frequency is absolutely on fire tonight. Best stream in Sector d7!',
  '$XENTS token ledger is pumping. Let\'s keep the sovereign royals splits flowing!',
  'Did anyone hear the sub-base drops at the transition? Absolute pristine engineering.',
  'Sovereign digital miners mining block frequencies live! 💿💎',
  'Perfect stream playlist to write decryptors and on-chain scripts for.',
  'Sovereign creators are taking back the spectrum clock! Kudos to 33.3FM.',
  'Decentralized audio is the only sound of liberty 🕊️. Keep spinning, DJ!',
  'My biomechanical limbs are tapping along to this tempo. Superb!',
  'DJ RED FANG is an absolute beast! Tip sent! 🔥🎧',
  'Ambient sweeps are incredibly immersive. Feels like sailing the digital grid.',
  'Who generated this? Absolute masterpiece track from Lyria Synth.',
];

interface BroadcastViewProps {
  onNavigate: (view: string, id?: string) => void;
  artists: Artist[];
  tracks: RadioTrack[];
  schedule: Show[];
  setTracks: React.Dispatch<React.SetStateAction<RadioTrack[]>>;
  setArtists: React.Dispatch<React.SetStateAction<Artist[]>>;
}

export default function BroadcastView({
  onNavigate,
  artists,
  tracks,
  schedule,
  setTracks,
  setArtists
}: BroadcastViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [nowPlaying, setNowPlaying] = useState<RadioTrack | null>(null);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [likes, setLikes] = useState(142);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasRated, setHasRated] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- START CO-RELEVANCE SOCIAL GRID STATES & HANDLERS ---
  const [comments, setComments] = useState<any[]>([
    {
      id: 'init-1',
      user: '@neon_circuit',
      avatarColor: 'bg-cyan-500 border border-cyan-400',
      text: 'This track hitting different on my auditory synth neural receptors! ⚡',
      timestamp: '05:22:15 AM'
    },
    {
      id: 'init-2',
      user: '@cyber_nomad',
      avatarColor: 'bg-emerald-500 border border-emerald-400',
      text: 'District 7 frequency is absolutely on fire tonight. Best stream in Sector d7!',
      timestamp: '05:24:42 AM'
    },
    {
      id: 'init-3',
      user: '@hologram_rider',
      avatarColor: 'bg-fuchsia-500 border border-fuchsia-400',
      text: '$XENTS token ledger is pumping. Let\'s keep the sovereign royals splits flowing!',
      timestamp: '05:25:01 AM'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLiveReactionBoostActive, setIsLiveReactionBoostActive] = useState(true);
  const [reacts, setReacts] = useState<{ id: number; char: string; left: number; duration: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const spawnReaction = (char: string) => {
    const id = Date.now() + Math.random();
    // Keep reactions floating within a sweet spot representing the vinyl and details areas
    const left = 5 + Math.random() * 90; 
    const duration = 2.0 + Math.random() * 1.5; // duration in seconds
    setReacts(prev => [...prev, { id, char, left, duration }]);
    
    setTimeout(() => {
      setReacts(prev => prev.filter(r => r.id !== id));
    }, 4000);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;
    
    const newComment = {
      id: `user-${Date.now()}-${Math.random()}`,
      user: '@chaoswired_spectator',
      avatarColor: 'bg-[#00ffe6] text-black border border-white font-black',
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setComments(prev => [...prev, newComment]);
    setUserInput('');
    addLog(`USER FEEDBACK SUBMITTED FOR CORE SYSTEM: "${userInput.slice(0, 24)}..."`);
    spawnReaction('💬');
  };

  // Real-time automated chatter update loop
  useEffect(() => {
    const intervalTime = isLiveReactionBoostActive ? 2200 : 7500;
    
    const chatInterval = setInterval(() => {
      const listener = MOCK_LISTENERS[Math.floor(Math.random() * MOCK_LISTENERS.length)];
      const msgText = CURATED_COMMENTS[Math.floor(Math.random() * CURATED_COMMENTS.length)];
      
      const nextComment = {
        id: `mock-${Date.now()}-${Math.random()}`,
        user: listener.user,
        avatarColor: listener.avatarColor,
        text: msgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setComments(prev => [...prev.slice(-40), nextComment]);

      // If boost is engaged, trigger occasional automated bubbling emojis from simulated participants
      if (isLiveReactionBoostActive && Math.random() > 0.25) {
        const randomEmoji = PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)];
        spawnReaction(randomEmoji);
      }
    }, intervalTime);
    
    return () => clearInterval(chatInterval);
  }, [isLiveReactionBoostActive]);

  // Handle auto scrolling for new replies
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);
  // --- END CO-RELEVANCE SOCIAL GRID STATES & HANDLERS ---

  // Rotation cycle timer
  useEffect(() => {
    // Pick initial track
    const activeTrack = tracks.find(t => t.status === 'live') || tracks[0];
    setNowPlaying(activeTrack || null);

    // Pick dynamic default liveshow
    const activeShow = schedule.find(s => s.status === 'live') || schedule[0];
    setCurrentShow(activeShow || null);

    // Seed initial telecom logs
    addLog('NEURAL UPLINK SECURED. SPEED: 33.3 Mbps');
    addLog('TUNING SPECTRUM TO CO-RELEVANCE GRID');
    addLog(`BROADCASTER: [${activeShow?.host || 'DJ RED FANG'}] ACTIVE STATUS: ON-AIR`);
    addLog(`NOW PLAYING MASTER DECK ARCHIVE ID: ${activeTrack?.title || 'MIDNIGHT GHOSTS'}`);
  }, [tracks, schedule]);

  // Rolling log utility
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-30), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Track Rotation Automaton
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Periodic log simulation
      const logChoices = [
        'SPECTRUM DRIFT MINIMAL — PEG REMAINS CONCOMITANT',
        'MCP CATALOG ENDPOINT ANSWERED IN 4MS',
        'MULTICHAIN MINT CONVECTING RECIPIENTS ON BASE',
        'V33 VAULT VAUNTS NEW SUBSCRIBERS',
        'SOUND SIGNATURE SECURED WITH SHANNON ENTROPY',
        'LYRIA HARMONY ENGINE TUNED TO PITCH BIAS',
        'LIQUIDITY RESERVE PEG MET AT 1.00 ratio',
        'ROTATION MATRIX RECONSTITUTED PRE-AUDIENCE'
      ];
      const randomLog = logChoices[Math.floor(Math.random() * logChoices.length)];
      addLog(randomLog);

      // Track play counts stats increment
      if (nowPlaying) {
        setArtists(prev =>
          prev.map(a => {
            if (a.name === nowPlaying.artist) {
              return {
                ...a,
                stats: {
                  ...a.stats,
                  plays: a.stats.plays + 1,
                  listeners: a.stats.listeners + (Math.random() > 0.7 ? 1 : 0)
                }
              };
            }
            return a;
          })
        );
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isPlaying, nowPlaying, setArtists]);

  // Action: Like Track
  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
      addLog(`REMOVED REVERENCE FROM TRACK: ${nowPlaying?.title}`);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      addLog(`REVERENCE RECORDED FOR TRACK: ${nowPlaying?.title} (+1 HYPERPROP)`);
    }
  };

  // Action: Rate Track
  const handleRate = (star: number) => {
    setHasRated(star);
    addLog(`SPECTRUM SCORE RATED [${'★'.repeat(star)}${'☆'.repeat(5 - star)}]`);
  };

  // Action: Spend tip via window.XentsChange API
  const handleTip = () => {
    if (!(window as any).XentsChange) {
      alert('Change Machine API not initialized. Restart Dev Server.');
      return;
    }

    const hostName = currentShow?.host || 'DJ RED FANG';
    const success = (window as any).XentsChange.spend({
      amount: 100,
      label: `TIP DJ: ${hostName}`,
      category: 'tip',
      autoTopUp: true,
      onSuccess: () => {
        addLog(`SUCCESSFULLY SPENT ⟁100 TIP FOR ${hostName.toUpperCase()}`);
        addLog(`+ ⟁85 REWARDED TO ${hostName.toUpperCase()}'s ON-CHAIN REVENUE MATRIX.`);
        addLog(`+ ⟁10 CONTRIBUTED TO CO-PLATFORM AND ⟁5 TO MINT REVENUE.`);
      }
    });

    if (success) {
      addLog(`SUCCESSFULLY SPENT ⟁100 TIP FOR ${hostName.toUpperCase()}`);
      addLog(`+ ⟁85 REWARDED TO ${hostName.toUpperCase()}'s ON-CHAIN REVENUE MATRIX.`);
      addLog(`+ ⟁10 CONTRIBUTED TO CO-PLATFORM AND ⟁5 TO MINT REVENUE.`);
    }
  };

  // Action: Select DJ Host and open profile
  const handleShowHostProfile = (hostName: string) => {
    const artist = artists.find(a => a.name.toLowerCase() === hostName.toLowerCase());
    if (artist) {
      onNavigate('artist', artist.id);
    } else {
      addLog(`COLLATERAL SPECTRUM GUEST HOST PROFILE TEMPORARILY SECURED [${hostName}]`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Broadcaster Deck */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* PLAYER HERO VIEW */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black p-6 shadow-2xl">
          {/* Neon Scanner Light */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00ffe6] to-transparent animate-pulse" />

          {/* Real-time floating reactions layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {reacts.map(react => (
              <motion.div
                key={react.id}
                initial={{ y: '240px', opacity: 0, scale: 0.5 }}
                animate={{ 
                  y: '-10px', 
                  opacity: [0, 1, 1, 0], 
                  scale: [0.5, 1.4, 1.4, 0.9],
                  x: [0, Math.sin(react.id * 5) * 70, Math.cos(react.id * 3) * -60, Math.sin(react.id * 1.5) * 50]
                }}
                transition={{ duration: react.duration, ease: 'easeOut' }}
                className="absolute text-3xl select-none"
                style={{ left: `${react.left}%`, bottom: '0px' }}
              >
                {react.char}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6">
            {/* Visual Vinyl Disc */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={isPlaying ? { repeat: Infinity, duration: 15, ease: 'linear' } : { duration: 0.5 }}
                className="relative h-44 w-44 rounded-full border-4 border-neutral-900 bg-neutral-950 shadow-[0_0_40px_rgba(0,255,230,0.15)] flex items-center justify-center overflow-hidden"
              >
                {/* Center Core */}
                <div className="h-14 w-14 rounded-full bg-black border-2 border-[#c2a633] flex items-center justify-center z-10">
                  <div className="h-3 w-3 rounded-full bg-[#00ffe6] animate-ping" />
                </div>
                {/* Vinyl Tracks grooves */}
                <div className="absolute inset-3 rounded-full border border-neutral-900" />
                <div className="absolute inset-8 rounded-full border border-neutral-900" />
                <div className="absolute inset-14 rounded-full border border-neutral-900/60" />
                <div className="absolute inset-18 rounded-full border border-neutral-900/40" />

                {/* Cover Image/Glyph */}
                <span className="absolute font-orbitron font-black text-6xl text-neutral-900 pointer-events-none select-none">
                  33⅓
                </span>
                {nowPlaying?.artist === 'DJ RED FANG' && (
                  <span className="absolute top-4 font-orbitron text-red-600 font-extrabold text-xl select-none">
                    RED
                  </span>
                )}
              </motion.div>

              {/* On-Air badge overlay */}
              <div className="absolute -top-1 -left-1 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded font-orbitron text-[9px] text-white tracking-widest uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </div>
            </div>

            {/* Now Playing Details */}
            <div className="flex-1 flex flex-col justify-between text-center md:text-left">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-[#c2a633] font-mono text-[9px] tracking-[0.25em] uppercase">
                  <Radio className="h-3 w-3 text-[#c2a633]" /> NOW SPINNING ON-AIR
                </div>
                <h2 className="mt-2 text-2xl md:text-3xl font-orbitron font-extrabold text-[#00ffe6] tracking-tight drop-shadow-[0_0_12px_rgba(0,255,230,0.25)]">
                  {nowPlaying?.title || 'MIDNIGHT GHOSTS'}
                </h2>
                <button
                  onClick={() => nowPlaying && handleShowHostProfile(nowPlaying.artist)}
                  className="mt-1 text-sm font-semibold tracking-wider text-[#c2a633] hover:text-[#00ffe6] transition-colors focus:outline-none"
                >
                  by {nowPlaying?.artist || 'DJ RED FANG'}
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-neutral-400 font-mono">
                  <span>◢ DISTRICT: <strong className="text-white">{nowPlaying?.district || 'D7'}</strong></span>
                  <span>◢ SPEED: <strong className="text-white">{nowPlaying?.bpm || 92} BPM</strong></span>
                  <span>◢ KEY: <strong className="text-[#c2a633]">{nowPlaying?.key || 'F# MIN9'}</strong></span>
                </div>
              </div>

              {/* Live Audio Visualizer Graph */}
              <div className="my-4 h-12 flex items-end gap-1 px-1 bg-neutral-950/40 rounded border border-neutral-900/60 overflow-hidden">
                {Array.from({ length: 32 }).map((_, i) => {
                  const duration = 0.5 + Math.random() * 0.8;
                  const factor = isPlaying ? 100 : 8;
                  return (
                    <motion.div
                      key={i}
                      animate={isPlaying ? { height: ['10%', '100%', '30%', '80%', '10%'] } : { height: '10%' }}
                      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: '10%',
                        background: i % 2 === 0 ? 'linear-gradient(to top, #0052ff, #00ffe6)' : 'linear-gradient(to top, #ff1a2e, #c2a633)'
                      }}
                    />
                  );
                })}
              </div>

              {/* Deck Player Control Center */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    setIsPlaying(prev => !prev);
                    addLog(isPlaying ? 'TRANSMISSION TERMINATION COMMAND FIRED.' : 'NEURAL AUDIO BROADCAST PIPELINE ENGAGED.');
                  }}
                  className={`flex h-12 w-full md:w-36 items-center justify-center gap-2 font-orbitron font-bold text-xs tracking-widest text-black border shadow-md active:translate-y-0.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-[#c2a633] border-[#c2a633] hover:bg-[#d0b540] shadow-[0_0_15px_rgba(194,166,51,0.25)]'
                      : 'bg-[#00ffe6] border-[#00ffe6] hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,255,230,0.25)]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" /> PAUSE SIGNAL
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> PLAY DECK
                    </>
                  )}
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2 w-full md:w-44 text-neutral-500 hover:text-white transition-colors">
                  <Volume2 className="h-4 w-4" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={e => {
                      setVolume(Number(e.target.value));
                      addLog(`VOLUME DECK RE-COMPENSATED: ${e.target.value}%`);
                    }}
                    className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00ffe6]"
                  />
                  <span className="font-mono text-xs w-8 text-right">{volume}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVERENCE, TIPS & RATINGS ACTIONS PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center gap-2 py-4 border rounded font-orbitron text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              hasLiked
                ? 'bg-red-950/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-black'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-red-500' : ''}`} />
            {likes} REVERENCES
          </button>

          <button
            onClick={handleTip}
            className="flex items-center justify-center gap-2 py-4 border border-dashed border-[#c2a633] bg-[#c2a633]/5 text-[#c2a633] rounded font-orbitron text-xs font-black tracking-widest hover:bg-[#c2a633]/15 hover:shadow-[0_0_20px_rgba(194,166,51,0.2)] transition-all cursor-pointer"
          >
            <Flame className="h-4 w-4 animate-bounce" />
            TIP ⟁ 100 TO HOST
          </button>

          <div className="flex items-center justify-center gap-1 py-3.5 border border-neutral-800 bg-neutral-950/50 rounded">
            {Array.from({ length: 5 }).map((_, i) => {
              const ratingVal = i + 1;
              const active = ratingVal <= (hasRated || 0);
              return (
                <button
                  key={i}
                  onClick={() => handleRate(ratingVal)}
                  className={`text-lg transition-colors cursor-pointer focus:outline-none ${
                    active ? 'text-[#c2a633]' : 'text-neutral-700 hover:text-neutral-400'
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>

        {/* LOG CONSOLE */}
        <div className="border border-neutral-800 bg-neutral-950 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3">
            <span className="font-orbitron font-bold text-xs text-[#00ffe6] tracking-widest uppercase">
              ◢ SPECTRUM NET TELEMETRY
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-[9px] text-emerald-400">STATUS: LIVE CONNECTED</span>
            </div>
          </div>
          <div
            ref={logContainerRef}
            className="h-36 overflow-y-auto font-mono text-[10px] text-neutral-400 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-900"
          >
            {logs.map((log, index) => (
              <div key={index} className="hover:bg-neutral-900/40 px-1 py-0.5 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Show Grid & Broadcaster Details */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* CURRENT LIVE SHOW INFOCARD */}
        <div className="border border-neutral-800 bg-gradient-to-b from-neutral-900/50 to-neutral-950 p-5 rounded-xl text-[#00ffe6]">
          <div className="flex items-center gap-1 text-[#ff1a2e] font-mono text-[9px] tracking-widest uppercase mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
            LIVE PROGRAM
          </div>
          <h3 className="text-lg font-orbitron font-black text-white leading-tight uppercase tracking-wider">
            {currentShow?.title || 'CIPHER HOUR'}
          </h3>
          <p className="mt-1 font-mono text-xs text-[#c2a633] font-bold">
            with host · {currentShow?.host || 'DJ RED FANG'}
          </p>

          <p className="mt-4 font-mono text-xs text-neutral-400 leading-relaxed">
            {currentShow?.description ||
              'Late-night chaos protocol. Velvet cyber-soul & unreleased sub-bass loops from District 7.'}
          </p>

          <div className="mt-6 border-t border-neutral-900 pt-4 flex items-center justify-between">
            <button
              onClick={() => currentShow && handleShowHostProfile(currentShow.host)}
              className="font-orbitron text-[10px] font-bold tracking-widest text-[#00ffe6] border border-[#00ffe6]/40 hover:bg-[#00ffe6] hover:text-black py-2 px-4 transition-colors cursor-pointer"
            >
              OPEN HOST PROFILE
            </button>
            <span className="font-mono text-xs text-neutral-400 tracking-wider">
              ROTATION: {currentShow?.duration || 60} MIN
            </span>
          </div>
        </div>

        {/* BROADCAST SHOW GRID SCHEDULE */}
        <div className="border border-neutral-800 bg-black/60 p-5 rounded-xl">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
            <span className="font-orbitron font-black text-xs text-[#c2a633] tracking-[0.2em] uppercase">
              ◢ ROTATION SCHEDULE
            </span>
            <span className="font-mono text-[9px] text-neutral-500">24/7 BROADCAST CLOCK</span>
          </div>

          <div className="flex flex-col gap-3">
            {schedule.slice(0, 5).map((show, idx) => {
              const live = show.status === 'live';
              return (
                <div
                  key={idx}
                  className={`relative p-3 border rounded transition-all flex items-center justify-between ${
                    live
                      ? 'bg-neutral-900/60 border-[#ff1a2e] shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]'
                      : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-xs font-black text-white tracking-wide uppercase">
                        {show.title}
                      </span>
                      {live && (
                        <span className="text-[8px] font-orbitron bg-red-600 text-white px-1 py-0.5 rounded animate-pulse">
                          ON-AIR
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-neutral-400">
                      Host: <strong className="text-[#00ffe6]">{show.host}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[13px] font-bold text-[#c2a633]">
                      {show.time}
                    </span>
                    <div className="font-mono text-[8px] text-neutral-500 uppercase mt-0.5">
                      {show.type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REAL-TIME CHATTER LOOP & INTENSE REACTION PANEL */}
        <div className="border border-neutral-800 bg-neutral-950/80 p-5 rounded-xl flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#00ffe6] animate-pulse" />
              <span className="font-orbitron font-black text-xs text-[#00ffe6] tracking-[0.15em] uppercase">
                ◢ SECTOR DL7.LOOP
              </span>
            </div>
            
            {/* Live Reaction Boost Switch */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-neutral-400">LIVE REACTIONS:</span>
              <button
                type="button"
                onClick={() => {
                  setIsLiveReactionBoostActive(!isLiveReactionBoostActive);
                  addLog(`CHANGED REACTION LOOP ENERGETIC STATE to ${!isLiveReactionBoostActive ? 'HYPERBOOST' : 'STEADY FEED'}`);
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isLiveReactionBoostActive ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                    isLiveReactionBoostActive ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Social Feedback Messages Stream */}
          <div className="h-64 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-neutral-900">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-2.5 rounded border border-neutral-900/60 bg-black/40 hover:bg-neutral-900/30 transition-all flex gap-3 text-[11px]"
              >
                {/* Micro Avatar Icon */}
                <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[9px] uppercase ${comment.avatarColor}`}>
                  {comment.user.charAt(1)}
                </div>
                {/* Meta details & copy content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-[#00ffe6] truncate">
                      {comment.user}
                    </span>
                    <span className="font-mono text-[8.5px] text-neutral-500 whitespace-nowrap">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-neutral-300 leading-normal break-words font-sans">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Signal Boost Preset Buttons */}
          <div className="border-t border-neutral-900/80 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] text-[#c2a633] font-mono leading-none mb-1">
              <span>◤ REACTION CONSOLE SIGNAL BOOST:</span>
              {isLiveReactionBoostActive && (
                <span className="text-[8px] bg-[#00ffe6]/10 text-[#00ffe6] px-1 py-0.5 rounded animate-pulse font-bold">
                  AUTO-EMIT ACTIVE
                </span>
              )}
            </div>
            {/* presets flex */}
            <div className="flex justify-between gap-1.5">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    spawnReaction(emoji);
                    addLog(`CAPTURED DIRECT INPUT REACTION: ${emoji}`);
                  }}
                  className="flex-1 py-2 rounded bg-neutral-900/80 border border-neutral-800 text-center hover:bg-[#00ffe6]/15 hover:border-[#00ffe6] hover:text-[#00ffe6] hover:scale-105 active:scale-95 transition-all cursor-pointer text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit input comment bar form */}
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Inject commentary into loop..."
              className="flex-1 bg-black border border-neutral-800 focus:border-[#00ffe6] rounded px-3 py-2 text-xs font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-3 bg-[#00ffe6] hover:bg-cyan-400 text-black rounded transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
