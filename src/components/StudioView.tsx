/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Music, 
  Sparkles, 
  Key, 
  Percent, 
  Globe, 
  Play, 
  User, 
  Plus, 
  Check, 
  Mic, 
  Disc, 
  Sliders, 
  Volume2, 
  Pause, 
  Heart, 
  FileText,
  Search,
  Activity,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Artist, RadioTrack, Show, SplitConfig } from '../types';
import SignalBeatMixer from './SignalBeatMixer';

interface StudioViewProps {
  onNavigate: (view: string, id?: string) => void;
  artists: Artist[];
  tracks: RadioTrack[];
  schedule: Show[];
  setTracks: React.Dispatch<React.SetStateAction<RadioTrack[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<Show[]>>;
}

export default function StudioView({
  onNavigate,
  artists,
  tracks,
  schedule,
  setTracks,
  setSchedule
}: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'ingest' | 'lyria_studio' | 'talk_radio' | 'voice_casting' | 'djs' | 'scripts' | 'splits' | 'distribution'>('lyria_studio');

  // Lyria Music Synthesizer States
  const [lyriaStyle, setLyriaStyle] = useState('Cyberpunk Synth');
  const [lyriaMood, setLyriaMood] = useState('Dark');
  const [lyriaLyrics, setLyriaLyrics] = useState('Auto Lyrics');
  const [lyriaLength, setLyriaLength] = useState('Clip (30s)');
  const [lyriaTheme, setLyriaTheme] = useState('Sovereign digital miners mining block frequencies');
  const [lyriaLoading, setLyriaLoading] = useState(false);
  const [lyriaProgress, setLyriaProgress] = useState('');
  const [generatedLyriaTrack, setGeneratedLyriaTrack] = useState<any>(null);
  const [lyriaPlaying, setLyriaPlaying] = useState(false);
  const lyriaAudioCtxRef = useRef<AudioContext | null>(null);
  const lyriaOscNodesRef = useRef<any[]>([]);
  const lyriaPlayIntervalRef = useRef<any>(null);

  // AI Talk Radio States
  const [talkTopic, setTalkTopic] = useState('The value of sovereign creativity and multichain royalty splits in Sector d7');
  const [talkDuration, setTalkDuration] = useState('Short (3 min)');
  const [talkPanelists, setTalkPanelists] = useState<string[]>(['DJ RED FANG', 'DJ LIQUID BYTE', 'HACKER ONE']);
  const [talkLoading, setTalkLoading] = useState(false);
  const [generatedTalkScript, setGeneratedTalkScript] = useState<any[]>([]);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(-1);
  const [talkPlaying, setTalkPlaying] = useState(false);
  const talkPlayIntervalRef = useRef<any>(null);

  // Voice Casting states
  const [castingSearch, setCastingSearch] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [mockSpeakText, setMockSpeakText] = useState('Digital voice grid online. Ready to synthesize broadcast content.');
  const [speakingActive, setSpeakingActive] = useState(false);

  // Scheduler forms
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowHost, setNewShowHost] = useState('');
  const [newShowTime, setNewShowTime] = useState('04:00');
  const [newShowDesc, setNewShowDesc] = useState('');

  // Track Ingest forms
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackBpm, setNewTrackBpm] = useState(120);
  const [newTrackKey, setNewTrackKey] = useState('A min');

  // Script Gen forms
  const [scriptHost, setScriptHost] = useState('DJ RED FANG');
  const [scriptShow, setScriptShow] = useState('CIPHER HOUR');
  const [scriptTrack, setScriptTrack] = useState('MIDNIGHT GHOSTS');
  const [scriptArtist, setScriptArtist] = useState('DJ RED FANG');
  const [scriptMood, setScriptMood] = useState('sultry');
  const [scriptAudience, setScriptAudience] = useState('1,842');
  const [generatedScript, setGeneratedScript] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);

  // Splits configuration
  const [onChainSplits, setOnChainSplits] = useState<SplitConfig[]>([
    {
      scope: 'GLOBAL BROADCAST REVENUE',
      trigger: 'MINT REQUISITION',
      splits: [
        { chain: 'base', addr: '0x84E1bc490Fa3...3C5b', pct: 85, label: 'Artist Account' },
        { chain: 'base', addr: '0x333FDa49c4fA...1c4b', pct: 10, label: 'Platform Infrastructure' },
        { chain: 'base', addr: '0x999FA49df49A...024B', pct: 5, label: 'Ecosystem Treasury' }
      ],
      saved: Date.now() - 6 * 3600000
    }
  ]);
  const [newSplitRecipient, setNewSplitRecipient] = useState('');
  const [newSplitPct, setNewSplitPct] = useState(10);
  const [newSplitLabel, setNewSplitLabel] = useState('');

  useEffect(() => {
    if (artists.length && !newShowHost) {
      setNewShowHost(artists[0].name);
    }
    if (tracks.length && !scriptTrack) {
      setScriptTrack(tracks[0].title);
      setScriptArtist(tracks[0].artist);
    }
  }, [artists, tracks]);

  // Cleanups on unmount
  useEffect(() => {
    return () => {
      if (lyriaPlayIntervalRef.current) {
        clearInterval(lyriaPlayIntervalRef.current);
      }
      if (talkPlayIntervalRef.current) {
        clearInterval(talkPlayIntervalRef.current);
      }
      try {
        if (lyriaAudioCtxRef.current) {
          lyriaAudioCtxRef.current.close();
        }
      } catch (err) {}
    };
  }, []);

  // Action: Generate Lyria Track using Gemini API with automatic fallback simulation
  const handleGenerateLyriaSong = async () => {
    if (lyriaLoading) return;
    setLyriaLoading(true);
    setLyriaProgress('◤ INITIALIZING QUANTUM LYRIA AUDIO CORE...');
    setGeneratedLyriaTrack(null);
    setLyriaPlaying(false);

    if (lyriaPlayIntervalRef.current) {
      clearInterval(lyriaPlayIntervalRef.current);
    }

    const steps = [
      '◤ WARMING UP FREQUENCY EMITTERS [22%]',
      '◤ HARMONIZING WAVE RECEPTORS [45%]',
      '◤ COMILING MULTICHAIN LEDGER BEATS [68%]',
      '◤ SYNTHESIZING VOCALS & SPECTRAL RESONANCE [89%]',
      '◤ PACKAGING WAV AUDIO CONTAINER [100%]'
    ];

    let currentStep = 0;
    const progressTimer = setInterval(() => {
      if (currentStep < steps.length) {
        setLyriaProgress(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(progressTimer);
      }
    }, 450);

    try {
      const response = await fetch('/api/generate-lyrics-and-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: lyriaStyle,
          mood: lyriaMood,
          theme: lyriaTheme,
          lyricsOption: lyriaLyrics
        })
      });
      const data = await response.json();
      
      if (data.success && data.track) {
        const { title, description, bpm, key, lyrics, vibe } = data.track;
        const newTrack: RadioTrack = {
          title: title || 'QUANTUM SHUNT',
          artist: 'LYRIA CORE',
          district: 'D7 — SPECTRAL WIRELESS',
          bpm: Number(bpm) || 120,
          key: key || 'A min',
          chain: 'base',
          status: 'rotation',
          ingested: Date.now()
        };

        // Prepend generated track directly to standard radio rotation
        setTracks(prev => {
          const updated = [newTrack, ...prev];
          try {
            localStorage.setItem('wc_radio_tracks', JSON.stringify(updated));
          } catch (err) {}
          return updated;
        });

        setGeneratedLyriaTrack({
          title: title || 'QUANTUM SHUNT',
          description: description || 'Synthesized live under dark spectrum parameters.',
          bpm: Number(bpm) || 120,
          key: key || 'A min',
          lyrics: lyrics || 'No vocals.',
          style: lyriaStyle,
          mood: lyriaMood
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(progressTimer);
      setLyriaLoading(false);
    }
  };

  // Action: Interactive Audio synthesis for Lyria (Web Audio API synthesis sequences)
  const toggleLyriaPlayback = () => {
    if (lyriaPlaying) {
      // Pause
      setLyriaPlaying(false);
      if (lyriaPlayIntervalRef.current) {
        clearInterval(lyriaPlayIntervalRef.current);
        lyriaPlayIntervalRef.current = null;
      }
    } else {
      // Play
      setLyriaPlaying(true);
      if (!lyriaAudioCtxRef.current) {
        lyriaAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = lyriaAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      let step = 0;
      const bpm = generatedLyriaTrack?.bpm || 120;
      const intervalMs = (60 / bpm) * 1000 / 2; // 8th note triggers

      lyriaPlayIntervalRef.current = setInterval(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Style specific audio synthesis patterns!
        if (lyriaStyle.toLowerCase().includes('phonk')) {
          osc.type = 'sawtooth';
          const baseNotes = [55, 55, 65.4, 65.4, 73.4, 82.4, 55, 110];
          osc.frequency.setValueAtTime(baseNotes[step % baseNotes.length], ctx.currentTime);
          
          filter.type = 'lowpass';
          filter.frequency.value = 350;
        } else if (lyriaStyle.toLowerCase().includes('synth') || lyriaStyle.toLowerCase().includes('cyber')) {
          osc.type = 'square';
          const spaceArp = [329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
          osc.frequency.setValueAtTime(spaceArp[step % spaceArp.length], ctx.currentTime);
          
          filter.type = 'lowpass';
          filter.frequency.value = 800;
        } else {
          osc.type = 'triangle';
          const mellowTones = [220, 261.6, 329.6, 220, 293.7, 349.2, 392, 440];
          osc.frequency.setValueAtTime(mellowTones[step % mellowTones.length], ctx.currentTime);
          
          filter.type = 'lowpass';
          filter.frequency.value = 450;
        }

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);

        step = (step + 1) % 8;
      }, intervalMs);
    }
  };

  // Action: Generate live debate podcast speech transcript using Gemini API with automatic fallback
  const handleGenerateTalkShow = async () => {
    if (talkLoading) return;
    setTalkLoading(false);
    setTalkLoading(true);
    setGeneratedTalkScript([]);
    setActiveSpeakerIndex(-1);
    setTalkPlaying(false);

    if (talkPlayIntervalRef.current) {
      clearInterval(talkPlayIntervalRef.current);
    }

    try {
      const res = await fetch('/api/generate-talkshow-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: talkTopic,
          panelists: talkPanelists,
          durationStyle: talkDuration
        })
      });
      const data = await res.json();
      if (data.success && data.script) {
        setGeneratedTalkScript(data.script);
        setActiveSpeakerIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTalkLoading(false);
    }
  };

  // Action: Play / auto-advance dialogue lines
  const toggleTalkShowPlayback = () => {
    if (talkPlaying) {
      setTalkPlaying(false);
      if (talkPlayIntervalRef.current) {
        clearInterval(talkPlayIntervalRef.current);
        talkPlayIntervalRef.current = null;
      }
    } else {
      if (generatedTalkScript.length === 0) return;
      setTalkPlaying(true);
      
      const talkAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      talkPlayIntervalRef.current = setInterval(() => {
        setActiveSpeakerIndex(prev => {
          const nextVal = prev + 1;
          if (nextVal >= generatedTalkScript.length) {
            clearInterval(talkPlayIntervalRef.current);
            setTalkPlaying(false);
            return -1;
          }

          // Trigger a cute electronic radio transmit speaker beep on turn transition
          try {
            const beepOsc = talkAudioCtx.createOscillator();
            const beepGain = talkAudioCtx.createGain();
            beepOsc.type = 'sine';
            beepOsc.frequency.setValueAtTime(440, talkAudioCtx.currentTime);
            beepGain.gain.setValueAtTime(0.02, talkAudioCtx.currentTime);
            beepGain.gain.exponentialRampToValueAtTime(0.0001, talkAudioCtx.currentTime + 0.08);
            beepOsc.connect(beepGain);
            beepGain.connect(talkAudioCtx.destination);
            beepOsc.start();
            beepOsc.stop(talkAudioCtx.currentTime + 0.09);
          } catch (e) {}

          return nextVal;
        });
      }, 5500); // 5.5s delay to let you read the transcription subtitles comfortably!
    }
  };

  // Action: Test Custom spoken dialogue on voice preview
  const handleTestVocalPreview = () => {
    if (speakingActive) return;
    setSpeakingActive(true);

    const speakSynth = window.speechSynthesis;
    if (speakSynth && speakSynth.speak) {
      const utterance = new SpeechSynthesisUtterance(mockSpeakText);
      
      // Attempt to apply different pitch/rate properties based on selected casting voices!
      if (selectedVoice === 'Fenrir') {
        utterance.pitch = 0.7; // Low, sultry velvet
        utterance.rate = 0.85;
      } else if (selectedVoice === 'Zephyr') {
        utterance.pitch = 1.35; // Sharp hacktivist intelligence
        utterance.rate = 1.15;
      } else if (selectedVoice === 'Puck') {
        utterance.pitch = 0.55; // Deep numeric drone
        utterance.rate = 1.0;
      } else if (selectedVoice === 'Kore') {
        utterance.pitch = 1.1; // Spatial robotic shimmer
        utterance.rate = 0.95;
      }

      utterance.onend = () => {
        setSpeakingActive(false);
      };
      utterance.onerror = () => {
        setSpeakingActive(false);
      };
      speakSynth.speak(utterance);
    } else {
      // Fallback: Web Audio pitch frequency sweep with static hum
      try {
        const fallbackCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fOsc = fallbackCtx.createOscillator();
        const fGain = fallbackCtx.createGain();
        
        fOsc.type = 'sawtooth';
        // sweep from 150hz up to 80hz (representing synth hum)
        fOsc.frequency.setValueAtTime(150, fallbackCtx.currentTime);
        fOsc.frequency.linearRampToValueAtTime(80, fallbackCtx.currentTime + 1.2);
        
        fGain.gain.setValueAtTime(0.05, fallbackCtx.currentTime);
        fGain.gain.exponentialRampToValueAtTime(0.0001, fallbackCtx.currentTime + 1.2);
        
        fOsc.connect(fGain);
        fGain.connect(fallbackCtx.destination);
        fOsc.start();
        setTimeout(() => {
          fallbackCtx.close();
          setSpeakingActive(false);
        }, 1300);
      } catch (err) {
        setSpeakingActive(false);
      }
    }
  };

  // Action: Assign System Vocoder Crossover and set is active script host
  const handleAssignVocoder = (voiceName: string) => {
    setSelectedVoice(voiceName);
    
    // Map selected voice name to scriptHost state cleanly
    let mappedHost = 'DJ RED FANG';
    if (voiceName === 'Fenrir') mappedHost = 'FENRIR RESONANCE';
    if (voiceName === 'Zephyr') mappedHost = 'ZEPHYR REBEL';
    if (voiceName === 'Puck') mappedHost = 'PUCK MONOTONE';
    if (voiceName === 'Kore') mappedHost = 'KORE ANNOUNCER';

    setScriptHost(mappedHost);
  };

  // Action: Add new show to scheduler
  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowTitle.trim()) return;

    const newShow: Show = {
      time: newShowTime,
      title: newShowTitle.toUpperCase(),
      host: newShowHost,
      type: 'LIVE',
      duration: 60,
      description: newShowDesc || 'Live broadcast slot administered in Studio Console.',
      status: 'queued',
      created: Date.now()
    };

    setSchedule(prev => {
      const merged = [...prev, newShow].sort((a, b) => a.time.localeCompare(b.time));
      try {
        localStorage.setItem('wc_radio_schedule', JSON.stringify(merged));
      } catch (err) {}
      return merged;
    });

    setNewShowTitle('');
    setNewShowDesc('');
  };

  // Action: Ingest Track
  const handleIngestTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;

    const citizen = artists.find(a => a.name.toLowerCase() === newTrackArtist.toLowerCase());
    const districtName = citizen ? citizen.district : 'D1 — CENTRAL WIRED';

    const newTrack: RadioTrack = {
      title: newTrackTitle,
      artist: newTrackArtist || 'DJ RED FANG',
      district: districtName,
      bpm: newTrackBpm,
      key: newTrackKey,
      chain: 'base',
      status: 'rotation',
      ingested: Date.now()
    };

    setTracks(prev => {
      const merged = [newTrack, ...prev];
      try {
        localStorage.setItem('wc_radio_tracks', JSON.stringify(merged));
      } catch (err) {}
      return merged;
    });

    setNewTrackTitle('');
  };

  // Action: Generate Speech Script (Express endpoint query)
  const handleGenerateScript = async () => {
    setScriptLoading(true);
    setGeneratedScript('');

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: scriptHost,
          showTitle: scriptShow,
          trackTitle: scriptTrack,
          trackArtist: scriptArtist,
          mood: scriptMood,
          audienceSize: scriptAudience
        })
      });

      const data = await res.json();
      if (data.success && data.script) {
        setGeneratedScript(data.script);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      console.warn('Backend Gemini call failed, applying dynamic custom fallback:', err);
      // Immersive fallback depending on the selected host brand bible!
      if (scriptHost === 'DJ RED FANG') {
        setGeneratedScript(`[microphone static crackle, RED FANG sighs softly, leaning in close]

You’re tuned into 33.3 FM… where the signal bites back.

We’re drifting into D7 frequency right now with ${scriptAudience} nocturnal souls riding this spectrum loop. It’s ${scriptMood}, it’s velvet. 
Let the sub-bass crawl up your spine... this is "${scriptTrack.toUpperCase()}" by ${scriptArtist}. Own your sound, lock the code. Let it play…`);
      } else {
        setGeneratedScript(`[electronic synth tone, system chime alerts]

Welcome back into ${scriptShow} with your host, ${scriptHost}. 
We are routing neural signals across Dogechain to ${scriptAudience} synchronized terminals under a ${scriptMood} audio atmosphere.
We represent creative control, and up next is "${scriptTrack.toUpperCase()}" by ${scriptArtist}. Synchronizing beat levels now...`);
      }
    } finally {
      setScriptLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Studio Toolbar Tabs */}
      <div className="lg:w-1/4 flex flex-col bg-neutral-950 p-4 border border-neutral-900 rounded-xl h-fit">
        <h2 className="font-orbitron font-extrabold text-[#c2a633] tracking-widest text-[10px] uppercase pb-2 mb-3 border-b border-neutral-900">
          ◢ STUDIO CONTROL
        </h2>

        {/* Categories of Operations */}
        <div className="flex flex-col gap-4">
          {/* Core Broadcast Operations */}
          <div>
            <div className="text-[9px] font-orbitron font-bold text-neutral-600 tracking-widest uppercase mb-1.5 px-3">
              ◤ CORES
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('scheduler')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'scheduler' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> SHOW SCHEDULER
              </button>

              <button
                onClick={() => setActiveTab('ingest')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'ingest' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Music className="h-3.5 w-3.5" /> TRACK INGEST
              </button>

              <button
                onClick={() => setActiveTab('djs')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'djs' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <User className="h-3.5 w-3.5" /> AGENT JOCKEYS
              </button>
            </div>
          </div>

          {/* AI Creative Labs (New Templates) */}
          <div>
            <div className="text-[9px] font-orbitron font-bold text-neutral-600 tracking-widest uppercase mb-1.5 px-3">
              ◤ AI SOUND LABS
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('lyria_studio')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'lyria_studio' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Disc className="h-3.5 w-3.5 text-rose-500 animate-[spin_8s_linear_infinite]" /> LYRIA SYNTHESIZER
              </button>

              <button
                onClick={() => setActiveTab('talk_radio')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'talk_radio' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Mic className="h-3.5 w-3.5 text-lime-400" /> AI TALK RADIO
              </button>

              <button
                onClick={() => setActiveTab('voice_casting')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'voice_casting' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-amber-500" /> VOICE CASTINGS
              </button>

              <button
                onClick={() => setActiveTab('scripts')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'scripts' ? 'bg-[#c2a633]/20 text-[#c2a633] font-extrabold border-l-2 border-[#c2a633]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> SCRIPT ENGINE
              </button>
            </div>
          </div>

          {/* Revenue & Distribution */}
          <div>
            <div className="text-[9px] font-orbitron font-bold text-neutral-600 tracking-widest uppercase mb-1.5 px-3">
              ◤ TRANSMISSIONS
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('splits')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'splits' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Percent className="h-3.5 w-3.5" /> ROYALTY SPLITS
              </button>

              <button
                onClick={() => setActiveTab('distribution')}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 text-xs font-semibold cursor-pointer rounded transition-all ${
                  activeTab === 'distribution' ? 'bg-[#00ffe6]/10 text-[#00ffe6] font-extrabold border-l-2 border-[#00ffe6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> DDEX SHIFT FEEDS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio View Panel */}
      <div className="flex-1 bg-black/60 border border-neutral-900 p-6 rounded-xl">
        {/* Lyria Studio TAB with SignalBeat 3D Mixing Console */}
        {activeTab === 'lyria_studio' && (
          <div className="flex flex-col gap-4">
            <SignalBeatMixer />
          </div>
        )}

        {/* AI Talk Radio Tab */}
        {activeTab === 'talk_radio' && (
          <div className="flex flex-col gap-6 font-mono">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2 flex justify-between items-center">
              <span>◢ DEBATABLE FREQUENCY // ROUNDTABLE DISCUSSION CO-RELEVANCY</span>
              <span className="text-[10px] text-lime-400 animate-pulse font-normal">VOICES GATEWAY ONLINE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4 bg-neutral-950/40 p-4 border border-neutral-900 rounded-lg">
                <div>
                  <label className="block text-[9px] font-orbitron text-neutral-500 mb-1">DEBATING TOPIC</label>
                  <input
                    type="text"
                    value={talkTopic}
                    onChange={e => setTalkTopic(e.target.value)}
                    placeholder="Enter discussion logs..."
                    className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-orbitron text-neutral-500 mb-1 font-bold">DISCUSS DURATION</label>
                    <select
                      value={talkDuration}
                      onChange={e => setTalkDuration(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-neutral-450 outline-none"
                    >
                      <option>Short (3 min)</option>
                      <option>Standard (15 min)</option>
                      <option>Extended Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-orbitron text-neutral-500 mb-1">SYSTEM COAX PANELISTS</label>
                    <div className="text-[10px] text-[#c2a633] mt-1.5 font-bold">
                      {talkPanelists.join(', ')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTalkShow}
                  disabled={talkLoading}
                  className="w-full py-2.5 bg-gradient-to-b from-lime-950/40 to-lime-950/10 border border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-black font-bold font-orbitron text-xs tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {talkLoading ? 'PROCESSING DRAFT INTROLOGY (GEMINI)...' : '◤ SYNC REVOLTING ROUNDTABLE'}
                </button>
              </div>

              {/* Debate output dialogue view */}
              <div className="border border-neutral-900 bg-neutral-950/80 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="font-orbitron text-[9px] font-black text-neutral-500 block mb-3 uppercase">
                    ◢ ROUNDTABLE AUDIO SUBTITLING DIALOGS
                  </span>

                  {talkLoading ? (
                    <div className="h-41 flex items-center justify-center text-xs text-[#00ffe6] animate-pulse">
                      Assembling debate logs parameters...
                    </div>
                  ) : generatedTalkScript.length > 0 ? (
                    <div className="h-48 overflow-y-auto flex flex-col gap-2">
                      {generatedTalkScript.map((line, lIdx) => {
                        const isSpeakingNow = activeSpeakerIndex === lIdx;
                        return (
                          <div 
                            key={lIdx} 
                            className={`p-2 rounded border text-xs leading-normal transition-all ${
                              isSpeakingNow 
                              ? 'bg-neutral-900 border-lime-500/40 text-white' 
                              : 'bg-transparent border-transparent text-neutral-550'
                            }`}
                          >
                            <span className="font-orbitron font-black text-[9px] text-[#c2a633] block mb-0.5">
                              {line.speaker} {isSpeakingNow && '🎙️ (ACTIVE}'}
                            </span>
                            <p className="italic font-mono leading-tight">{line.dialogue}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-41 flex items-center justify-center text-xs text-neutral-600 text-center">
                      Roundtable discussion buffer is dry. Initiate discussion to synthesize.
                    </div>
                  )}
                </div>

                {generatedTalkScript.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleTalkShowPlayback}
                    className="w-full mt-3 py-2 border border-lime-500 text-lime-400 font-bold font-orbitron text-[10px]"
                  >
                    {talkPlaying ? 'PAUSE AUTOMATED TELECOMP' : '▶ TRANSMIT TELECOMP DIALOGUE'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Voice Casting Tab */}
        {activeTab === 'voice_casting' && (
          <div className="flex flex-col gap-6 font-mono">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2 flex justify-between items-center">
              <span>◢ BIOMETRIC VOCODER CASTING FEEDS</span>
              <span className="text-[10px] text-amber-500 animate-pulse font-normal">SPEECH SYNTHESIS ENGINE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <span className="font-orbitron text-[9px] text-neutral-500 block uppercase">◤ SELECT VOICE CHANNEL CROSSOVER</span>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Fenrir', bio: 'Low, smooth velvet dark voice', color: 'text-rose-500 border-rose-950' },
                    { name: 'Zephyr', bio: 'Sharp, active rebel hacktivist drone', color: 'text-cyan-400 border-cyan-950' },
                    { name: 'Puck', bio: 'Deep numeric robot announcer monotone', color: 'text-amber-400 border-amber-950' },
                    { name: 'Kore', bio: 'Crisp spatial shimmer announcer', color: 'text-purple-400 border-purple-950' }
                  ].map(vc => (
                    <div 
                      key={vc.name}
                      onClick={() => handleAssignVocoder(vc.name)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedVoice === vc.name 
                        ? 'bg-neutral-900 border-white text-white' 
                        : 'bg-neutral-950/40 border-neutral-900 text-neutral-400 hover:border-neutral-800'
                      }`}
                    >
                      <h4 className="font-orbitron font-black text-xs uppercase">{vc.name}</h4>
                      <p className="text-[9px] text-neutral-500 mt-1 leading-normal">{vc.bio}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesize speech inputs */}
              <div className="bg-neutral-950/40 p-5 border border-neutral-900 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="font-orbitron text-[9px] font-black text-neutral-500 block mb-2 uppercase">
                    ◢ TEST TEXT READOUT SIGNAL
                  </span>
                  
                  <textarea
                    value={mockSpeakText}
                    onChange={e => setMockSpeakText(e.target.value)}
                    className="w-full h-24 bg-black border border-neutral-800 rounded p-2.5 text-xs text-neutral-300 outline-none resize-none font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestVocalPreview}
                  disabled={speakingActive}
                  className="w-full mt-3 py-3 bg-gradient-to-b from-amber-950/40 to-amber-950/10 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold font-orbitron text-xs tracking-widest transition-all cursor-pointer disabled:opacity-50"
                >
                  {speakingActive ? 'SPEAKING CORE ACTIVE...' : '◤ RUN SYNTHESIS TRIGGER'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheduler TAB */}
        {activeTab === 'scheduler' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ BROADCAST GRID SCHEDULER
            </h3>

            {/* List shows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedule.map((show, idx) => (
                <div key={idx} className="border border-neutral-800 bg-neutral-950 p-4 rounded flex justify-between items-start">
                  <div>
                    <span className="font-orbitron text-xs font-extrabold text-[#c2a633] tracking-wide">
                      {show.title}
                    </span>
                    <p className="font-mono text-[9px] text-neutral-400 mt-1">Host: {show.host}</p>
                    <p className="font-mono text-[10px] text-neutral-500 mt-2 leading-relaxed">{show.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-orbitron text-sm text-[#00ffe6] font-bold">{show.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add show form */}
            <form onSubmit={handleAddShow} className="border border-neutral-900 bg-neutral-950/40 p-5 rounded mt-4">
              <h4 className="font-orbitron text-xs font-black text-neutral-400 uppercase mb-4">
                ◤ SCHEDULE BROADCAST SLOT
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-orbitron text-neutral-500 mb-1">SHOW TITLE</label>
                  <input
                    type="text"
                    value={newShowTitle}
                    onChange={e => setNewShowTitle(e.target.value)}
                    placeholder="e.g. SONIC SYNDICATE"
                    className="w-full bg-black border border-neutral-800 rounded p-2.5 text-xs text-[#00ffe6] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-orbitron text-neutral-500 mb-1">HOST DJ</label>
                  <select
                    value={newShowHost}
                    onChange={e => setNewShowHost(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded p-2.5 text-xs text-[#00ffe6] font-mono outline-none"
                  >
                    {artists.map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                    <option value="HUMAN GUEST">HUMAN GUEST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-orbitron text-neutral-500 mb-1">CLOCK TIME</label>
                  <input
                    type="text"
                    value={newShowTime}
                    onChange={e => setNewShowTime(e.target.value)}
                    placeholder="e.g. 05:00"
                    className="w-full bg-black border border-neutral-800 rounded p-2.5 text-xs text-center text-[#c2a633] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-orbitron text-neutral-500 mb-1">DESCRIPTION</label>
                <textarea
                  value={newShowDesc}
                  onChange={e => setNewShowDesc(e.target.value)}
                  placeholder="Insert briefing context logs..."
                  className="w-full h-16 bg-black border border-neutral-800 rounded p-2.5 text-xs text-neutral-400 font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-gradient-to-b from-[#00ffe6]/20 to-[#00ffe6]/5 border border-[#00ffe6] text-[#00ffe6] hover:bg-[#00ffe6] hover:text-black font-bold font-orbitron text-xs transition-colors cursor-pointer"
              >
                ◤ INTEGRATE IN SCHEDULER
              </button>
            </form>
          </div>
        )}

        {/* Track Ingest TAB */}
        {activeTab === 'ingest' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ STUDIO TRACK CATALOG INGEST
            </h3>

            {/* Ingest track input form */}
            <form onSubmit={handleIngestTrack} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-neutral-900 p-4 rounded bg-neutral-950/20">
              <input
                type="text"
                placeholder="INGEST TRACK TITLE"
                value={newTrackTitle}
                onChange={e => setNewTrackTitle(e.target.value)}
                className="bg-black border border-neutral-800 p-2 text-xs text-[#00ffe6] font-mono rounded outline-none"
              />
              <select
                value={newTrackArtist}
                onChange={e => setNewTrackArtist(e.target.value)}
                className="bg-black border border-neutral-800 p-2 text-xs text-[#c2a633] font-mono rounded outline-none"
              >
                <option value="">— CHOOSE ARTIST —</option>
                {artists.map(a => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="BPM"
                  value={newTrackBpm}
                  onChange={e => setNewTrackBpm(Number(e.target.value))}
                  className="bg-black border border-neutral-800 p-2 text-xs text-center text-neutral-400 font-mono w-1/2 rounded outline-none"
                />
                <input
                  type="text"
                  placeholder="KEY"
                  value={newTrackKey}
                  onChange={e => setNewTrackKey(e.target.value)}
                  className="bg-black border border-neutral-800 p-2 text-xs text-center text-neutral-400 font-mono w-1/2 rounded outline-none"
                />
              </div>
              <button
                type="submit"
                className="py-2 bg-[#00ffe6] text-black font-orbitron font-bold text-xs hover:bg-[#00ffe6]/80 transition-colors cursor-pointer"
              >
                + INGEST FILE
              </button>
            </form>

            <div className="mt-4 border border-neutral-900 rounded overflow-x-auto bg-black/40">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-950/60 font-orbitron text-[9px] text-[#00ffe6]">
                    <th className="p-3">TRACK</th>
                    <th className="p-3">ARTIST</th>
                    <th className="p-3">DISTRICT</th>
                    <th className="p-3">BPM</th>
                    <th className="p-3">KEY</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.slice(0, 15).map((track, idx) => (
                    <tr key={idx} className="border-b border-neutral-900/60 hover:bg-neutral-900/20 text-neutral-300">
                      <td className="p-3 font-bold text-white uppercase">{track.title}</td>
                      <td className="p-3 text-[#c2a633]">{track.artist}</td>
                      <td className="p-3 select-none text-[10px] text-neutral-500">{track.district}</td>
                      <td className="p-3 text-neutral-400">{track.bpm}</td>
                      <td className="p-3 text-neutral-400">{track.key}</td>
                      <td className="p-3 text-emerald-400 font-bold font-orbitron text-[9px]">{track.status.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agent DJs TAB */}
        {activeTab === 'djs' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ AGENT DISC JOCKEY STATIONS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {artists.filter(a => a.type === 'agent').map(dj => (
                <div key={dj.id} className="border border-neutral-800 bg-neutral-950 p-4 rounded flex gap-4">
                  <div
                    className="h-12 w-12 rounded-full border-2 border-[#00ffe6] flex items-center justify-center font-orbitron font-black text-lg select-none flex-shrink-0 shadow-[0_0_12px_rgba(0,255,230,0.2)]"
                    style={{ color: dj.avatar_color, borderColor: dj.avatar_color }}
                  >
                    {dj.avatar_glyph}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-orbitron text-sm font-black text-white">{dj.name}</h4>
                      <span className="text-[8px] font-orbitron text-emerald-500 bg-emerald-950/40 border border-emerald-800 px-1.5 py-0.5 rounded">
                        ON-AIR ACTIVE
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-[#c2a633] mt-1">{dj.genre}</p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-2 leading-relaxed">{dj.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Script Generator TAB */}
        {activeTab === 'scripts' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-[#c2a633] uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ INTELLIGENT SCRIPT DECK (GEMINI API)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form entries */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">HOST DJ</label>
                  <select
                    value={scriptHost}
                    onChange={e => setScriptHost(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                  >
                    {artists.filter(a => a.type === 'agent').map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">SHOW TITLE</label>
                  <input
                    type="text"
                    value={scriptShow}
                    onChange={e => setScriptShow(e.target.value)}
                    placeholder="e.g. CIPHER HOUR"
                    className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">TRACK TITLE</label>
                    <select
                      value={scriptTrack}
                      onChange={e => {
                        setScriptTrack(e.target.value);
                        const matched = tracks.find(t => t.title === e.target.value);
                        if (matched) setScriptArtist(matched.artist);
                      }}
                      className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                    >
                      {tracks.map((t, idx) => (
                        <option key={idx} value={t.title}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">TRACK ARTIST</label>
                    <input
                      type="text"
                      value={scriptArtist}
                      readOnly
                      className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#c2a633] font-mono outline-none opacity-80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">AIRSTYLE MOOD</label>
                    <select
                      value={scriptMood}
                      onChange={e => setScriptMood(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                    >
                      <option>sultry</option>
                      <option>velvet</option>
                      <option>chaotic aggressive</option>
                      <option>mellow focus</option>
                      <option>robotic digital</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-orbitron text-neutral-400 mb-1">AUDIENCE COUNT</label>
                    <input
                      type="text"
                      value={scriptAudience}
                      onChange={e => setScriptAudience(e.target.value)}
                      placeholder="e.g. 1,842"
                      className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-[#00ffe6] text-center font-mono focus:border-[#c2a633] outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={scriptLoading}
                  className="w-full mt-2 py-3 bg-[#c2a633] text-black hover:bg-[#c2a633]/80 font-orbitron font-extrabold text-xs tracking-widest cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  {scriptLoading ? 'TUNING FREQUENCY MATRIX (GEMINI)...' : '◤ GENERATE RADIO DJ INTRO'}
                </button>
              </div>

              {/* Script Output Result */}
              <div className="border border-neutral-800 bg-neutral-950 p-4 rounded flex flex-col justify-between">
                <div>
                  <span className="font-orbitron text-[10px] font-black text-neutral-500 block mb-2 uppercase">
                    ◢ TRANSCRIPTION TELETYPE OUTPUT
                  </span>
                  {scriptLoading ? (
                    <div className="h-44 flex items-center justify-center font-mono text-xs text-neutral-500 animate-pulse">
                      Synthesizing neural spectrum from process...
                    </div>
                  ) : (
                    <div className="h-44 overflow-y-auto font-mono text-xs text-neutral-300 leading-relaxed max-w-full italic whitespace-pre-wrap">
                      {generatedScript || 'No transmission buffered. Tune the controls and generate.'}
                    </div>
                  )}
                </div>
                {generatedScript && (
                  <div className="border-t border-neutral-900 pt-2 text-right">
                    <span className="font-orbitron font-black text-[9px] text-[#00ffe6]">
                      ◢ CO-RELEVANCY ALIGNED
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Royalty Splits TAB */}
        {activeTab === 'splits' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ ON-CHAIN ROYALTY SPLITS REGISTRY
            </h3>

            {onChainSplits.map((config, index) => (
              <div key={index} className="border border-neutral-900 bg-black/40 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="font-orbitron text-xs font-black text-[#c2a633]">
                    {config.scope}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-500 uppercase">
                    Trigger Event: {config.trigger}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {config.splits.map((split, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center text-xs font-mono p-2 hover:bg-neutral-900/30 rounded">
                      <span className="text-[#00ffe6]">{split.label}</span>
                      <span className="text-neutral-500 select-all">{split.addr}</span>
                      <span className="text-white font-bold">{split.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DDEX Feeds TAB */}
        {activeTab === 'distribution' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
              ◢ MUSIC DISTRIBUTION ROUTER (DDEX ERN FEEDS)
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-orbitron text-xs font-black text-[#00ffe6]">FEED INGEST TARGET: SPOTIFY</span>
                  <p className="font-mono text-[9px] text-neutral-400 mt-1">Status: TRANSMITTED Decimals OK</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-orbitron text-xs font-black text-[#00ffe6]">FEED INGEST TARGET: APPLE MUSIC</span>
                  <p className="font-mono text-[9px] text-neutral-400 mt-1">Status: TRANSMITTED metadata OK</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <div className="border border-neutral-900 bg-neutral-950 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-orbitron text-xs font-black text-[#00ffe6]">FEED INGEST TARGET: YOUTUBE MUSIC</span>
                  <p className="font-mono text-[9px] text-neutral-400 mt-1">Status: SYNCED art blocks verified</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
