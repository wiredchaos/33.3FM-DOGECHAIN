import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Sparkles, Play, Pause, RefreshCw, Cpu, Award, Zap, Heart, MessageSquare, Volume2, VolumeX, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';
import { Artist, OacRelease, RadioTrack } from '../types';
import { AgentStatusOrb } from './motion/AgentStatusOrb';
import { ChaosPulse } from './motion/ChaosPulse';

interface TalkshowViewProps {
  artists: Artist[];
  releases: OacRelease[];
  setReleases: React.Dispatch<React.SetStateAction<OacRelease[]>>;
  setTracks: React.Dispatch<React.SetStateAction<RadioTrack[]>>;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

interface TalkshowLine {
  speaker: string;
  line: string;
}

export default function TalkshowView({
  artists,
  releases,
  setReleases,
  setTracks,
  balance,
  setBalance
}: TalkshowViewProps) {
  // Funnel Level state mapping
  const [funnelLevel, setFunnelLevel] = useState<'awareness' | 'consideration' | 'conversion' | 'retention'>('awareness');
  
  // Custom Topic Prompt
  const [topicPrompt, setTopicPrompt] = useState('How Decentralized Music and OACs can bypass streaming monopolies.');
  const [panelists, setPanelists] = useState<string[]>(['DJ RED FANG', 'ZEPHYR REBEL', 'PUCK MONOTONE']);
  const [scriptHost, setScriptHost] = useState('DJ RED FANG');
  const [duration, setDuration] = useState('Short (3 min)');

  // API loading & script output
  const [isLoading, setIsLoading] = useState(false);
  const [scriptResult, setScriptResult] = useState<TalkshowLine[]>([]);
  const [activeTurn, setActiveTurn] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<any>(null);

  // Audio status
  const [isMuted, setIsMuted] = useState(false);
  const [audienceReactions, setAudienceReactions] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  
  // Minting after show completion
  const [wasMinted, setWasMinted] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintLogs, setMintLogs] = useState<string[]>([]);
  const [evaluationBypass, setEvaluationBypass] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);

  const MINT_COST = 5000;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      window.speechSynthesis?.cancel(); // Stop speaking immediately on leave
    };
  }, []);

  // Pre-set templates tailored to the Funnel Level to make it extremely easy
  const handleFunnelLevelChange = (level: 'awareness' | 'consideration' | 'conversion' | 'retention') => {
    setFunnelLevel(level);
    if (level === 'awareness') {
      setTopicPrompt('Introduction to Sector d7 broadcasting: How 33.3FM bypasses legacy barriers with style.');
      setPanelists(['DJ RED FANG', 'KORE SHIMMER']);
      setScriptHost('DJ RED FANG');
    } else if (level === 'consideration') {
      setTopicPrompt('The philosophical debate on on-chain royalties: Why a 10% platform fee beats 1% streaming pennies.');
      setPanelists(['DJ RED FANG', 'ZEPHYR REBEL', 'PUCK MONOTONE']);
      setScriptHost('ZEPHYR REBEL');
    } else if (level === 'conversion') {
      setTopicPrompt('Instant On-Chain Audio Collectible Minting guide: Hit that MINT toggle and unlock sovereign ownership now!');
      setPanelists(['DJ RED FANG', 'PUCK MONOTONE']);
      setScriptHost('PUCK MONOTONE');
    } else if (level === 'retention') {
      setTopicPrompt('Exclusive VIP vault access leaks: Server-side hidden keys, Dogechain metadata, and secret catalog codes.');
      setPanelists(['DJ RED FANG', 'ZEPHYR REBEL', 'KORE SHIMMER']);
      setScriptHost('KORE SHIMMER');
    }
    setScriptResult([]);
    setActiveTurn(-1);
    setIsPlaying(false);
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    window.speechSynthesis?.cancel();
  };

  const handleBypassCodeCheck = () => {
    if (evaluationBypass === 'WC-MUSICATHON-2026') {
      setIsBypassed(true);
      setMintLogs(prev => [...prev, '[SECURITY BYPASS APPROVED] Evaluation key validated. ⟁5,000 fee waived.']);
    } else {
      setIsBypassed(false);
    }
  };

  const launchTalkshow = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setScriptResult([]);
    setActiveTurn(-1);
    setIsPlaying(false);
    setWasMinted(false);
    setMintLogs([]);

    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    window.speechSynthesis?.cancel();

    // Fabricate specialized topic injecting funnel level instruction and target show title
    const formattedTopic = `[CAMPAIGN FUNNEL LEVEL: ${funnelLevel.toUpperCase()}] Focus topic: "${topicPrompt}". Primary Host is ${scriptHost}. Make the discussion highlight: ${
      funnelLevel === 'awareness' ? 'Introducing basic 33.3FM concepts and general digital track excitement.' : 
      funnelLevel === 'consideration' ? 'Detailed debate checking platform fees, code transparency, and blockchain advantage.' : 
      funnelLevel === 'conversion' ? 'Extremely urgent call-to-action details, instructing listeners to spend credits to mint OAC.' :
      'Highly exclusive, member secret access hints, giving VIP loyalty credits warnings.'
    }`;

    try {
      const res = await fetch('/api/generate-talkshow-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formattedTopic,
          panelists: panelists,
          durationStyle: duration
        })
      });
      const data = await res.json();
      if (data.success && data.script) {
        setScriptResult(data.script);
        setActiveTurn(0);
      } else {
        throw new Error('Spectrum alignment returned error.');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setScriptResult([
        { speaker: scriptHost, line: `[adjusting microphone] Attention Sector D7, this is a ${funnelLevel.toUpperCase()} transmission loop regarding ${topicPrompt}.` },
        { speaker: 'ZEPHYR REBEL', line: 'Signals verified. Stream bypass on, let the decentralized decimals flow.' },
        { speaker: 'PUCK MONOTONE', line: 'HANDSHAKE CODES ONLINE. CONVERSION PARAMETERS REACHED.' },
        { speaker: scriptHost, line: 'Let the spectrum bite back. Turn up the volume.' }
      ]);
      setActiveTurn(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Speaks the text using browser Speech Synthesis
  const speakDialogueLine = (speaker: string, dialogueText: string) => {
    if (isMuted) return;

    window.speechSynthesis?.cancel(); // Stop any currently playing speech

    // Clean up staging directions e.g. [excitedly] or [low murmur]
    const cleanedText = dialogueText.replace(/\[.*?\]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Customize voicing variables based on speaker handles
    const sName = speaker.toUpperCase();
    if (sName.includes('FANG') || sName.includes('RED')) {
      utterance.pitch = 0.72; // low, sultry velvet female/male
      utterance.rate = 0.88;
    } else if (sName.includes('ZEPHYR') || sName.includes('REBEL')) {
      utterance.pitch = 1.35; // high-strung, fast rebellious
      utterance.rate = 1.15;
    } else if (sName.includes('PUCK') || sName.includes('MONOTONE') || sName.includes('ROBOT')) {
      utterance.pitch = 0.5; // mechanical, hyper robotic drone
      utterance.rate = 0.95;
    } else if (sName.includes('KORE') || sName.includes('SHIMMER')) {
      utterance.pitch = 1.15; // robotic clear high shimmer
      utterance.rate = 0.92;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    window.speechSynthesis?.speak(utterance);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      window.speechSynthesis?.pause();
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    } else {
      if (scriptResult.length === 0) return;
      setIsPlaying(true);
      window.speechSynthesis?.resume();

      // Trigger first voice-line read immediately if starting from active line
      const currentLineObj = scriptResult[activeTurn === -1 ? 0 : activeTurn];
      if (currentLineObj) {
        speakDialogueLine(currentLineObj.speaker, currentLineObj.line);
      }

      // Loop dialogue lines with comfortable speed interval
      playIntervalRef.current = setInterval(() => {
        setActiveTurn(prev => {
          const nextVal = prev + 1;
          if (nextVal >= scriptResult.length) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            window.speechSynthesis?.cancel();
            return -1;
          }

          // Play Speech
          const nextLineObj = scriptResult[nextVal];
          if (nextLineObj) {
            speakDialogueLine(nextLineObj.speaker, nextLineObj.line);
          }

          // Trigger a beautiful audio cue "blip" on turn transitions
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.015, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          } catch (_) {}

          return nextVal;
        });
      }, 6200); // 6.2s delay handles speech readout comfortably
    }
  };

  const throwReaction = (emojiText: string) => {
    const rx = Math.random() * 80 + 10; // 10-90% width offset
    const id = Date.now() + Math.random();
    setAudienceReactions(prev => [...prev, { id, text: emojiText, x: rx, y: 100 }]);

    // Audio beep for reactions
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(Math.random() * 300 + 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (_) {}

    setTimeout(() => {
      setAudienceReactions(prev => prev.filter(r => r.id !== id));
    }, 2800);
  };

  // Convert and Mint the generated talk show dialogue as a newly listed catalog single track release!
  const mintShowAsOacTrack = async () => {
    if (isMinting || wasMinted) return;

    // Check Balance Gateway Check
    if (!isBypassed && balance < MINT_COST) {
      alert(`Handshake declined. Insufficient $XENTS credits balance. Need ⟁${MINT_COST.toLocaleString()} CREDITS. Or enter evaluators bypass key.`);
      return;
    }

    setIsMinting(true);
    setMintLogs([]);

    const log = (msg: string) => {
      const ts = new Date().toLocaleTimeString();
      setMintLogs(prev => [...prev, `[${ts}] ${msg}`]);
    };

    log('◤ INITIALIZING DECENTRALIZED TALKSHOW COMPILATION AGENT PIPELINE...');
    await new Promise(r => setTimeout(r, 1200));

    log('◤ AGENT_RELEASE: Compiling oral session dialogues as OAC Metadata structure.');
    await new Promise(r => setTimeout(r, 1000));

    log('◤ AGENT_RIGHTS: Generating multichain split configuration contracts for panelists.');
    await new Promise(r => setTimeout(r, 900));

    log('◤ AGENT_royalty: Securing 85% creator splits of future $XENTS royalties.');
    await new Promise(r => setTimeout(r, 1100));

    log('◤ CRYPTO_GUARD: Direct legal contract stamp and C2PA ownership imprint validated.');
    await new Promise(r => setTimeout(r, 800));

    // Create the release
    const randomId = 'oac_talk_' + Math.floor(Math.random() * 100000);
    const newReleaseObj: OacRelease = {
      id: randomId,
      trackTitle: `${funnelLevel.toUpperCase()}: ${topicPrompt.substring(0, 32).toUpperCase()}...`,
      artist: scriptHost,
      artistId: 'artist_fang', // map to DJ RED FANG by default
      audioUrl: null,
      distribution: {
        mintChains: ['doge', 'sol'],
        ddexTargets: ['spotify', 'youtube']
      },
      meta: {
        bpm: 120,
        key: 'A minor',
        mood: funnelLevel === 'conversion' ? 'Pumped' : 'Introspective',
        genre: 'AI Roundtable Show',
        durationSec: 180,
        source: 'Gemini Agent Orchestrated'
      },
      status: 'complete',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      agents: {
        release: { status: 'complete', completedAt: Date.now() },
        rights: { status: 'complete', completedAt: Date.now() },
        marketing: { status: 'complete', completedAt: Date.now() },
        royalty: { status: 'complete', completedAt: Date.now() }
      }
    };

    const newRadioTrack: RadioTrack = {
      title: `${funnelLevel.toUpperCase()}: ${topicPrompt.substring(0, 30)}`,
      artist: scriptHost,
      district: 'SECTOR D7',
      bpm: 120,
      key: 'A minor',
      chain: 'multi',
      status: 'rotation',
      ingested: Date.now(),
      oacRelease: true
    };

    // Charge balance unless bypassed
    if (!isBypassed) {
      setBalance(prev => Math.max(0, prev - MINT_COST));
    }

    // append to lists
    setReleases(prev => [newReleaseObj, ...prev]);
    setTracks(prev => [newRadioTrack, ...prev]);

    // Save lists to localStorage
    const savedReleases = JSON.parse(localStorage.getItem('wc_stored_releases') || '[]');
    localStorage.setItem('wc_stored_releases', JSON.stringify([newReleaseObj, ...savedReleases]));
    const savedTracks = JSON.parse(localStorage.getItem('wc_radio_tracks') || '[]');
    localStorage.setItem('wc_radio_tracks', JSON.stringify([newRadioTrack, ...savedTracks]));

    log(`◤ PLATFORM HANDSHAKE SUCCESS: OAC [${randomId}] compiled into Global Radio Rotation & Citizens Catalog!`);
    setIsMinting(false);
    setWasMinted(true);
  };

  return (
    <div className="flex flex-col gap-8 font-mono text-white">
      
      {/* Visual Heading banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <h2 className="font-orbitron font-extrabold text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            ◢ GEMINI AGENTS IN-FUNNEL AUDIO TALKSHOW
          </h2>
          <p className="text-[10px] text-neutral-500 leading-normal uppercase">
            Launch tailor-made radio dialogues and conversational tracks targeted perfectly at listeners conversion stages.
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <AgentStatusOrb status={isLoading ? "active" : isPlaying ? "active" : "idle"} size="sm" />
          <div className="text-[9px] text-neutral-400">
            <div>STATUS: <strong className={isLoading || isPlaying ? "text-[#00f5ff]" : "text-neutral-500"}>{isLoading ? "SYNTHESIZING..." : isPlaying ? "TRANSMITTING LIVE" : "LINK STANDBY"}</strong></div>
            <div>STATION: <strong className="text-white">33.3FM CH.7</strong></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Panelist Controls (4 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card: Funnel Level Selector */}
          <div className="border border-neutral-900 bg-neutral-950/45 p-5 rounded-2xl flex flex-col gap-4">
            <span className="text-[9px] font-orbitron font-black text-neutral-500 uppercase tracking-widest block">
              ◤ CHOOSE MARKETING FUNNEL LEVEL
            </span>
            
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { 
                  id: 'awareness', 
                  title: 'AWARENESS', 
                  subtitle: 'Top of Funnel', 
                  color: 'hover:border-[#00ffd6]/50', 
                  activeColor: 'border-[#00ffd6] bg-[#00ffd6]/5 text-[#00ffd6]',
                  desc: 'Catchy, inviting overview about Sector-D'
                },
                { 
                  id: 'consideration', 
                  title: 'CONSIDERATION', 
                  subtitle: 'Mid of Funnel', 
                  color: 'hover:border-[#c2a633]/50', 
                  activeColor: 'border-[#c2a633] bg-[#c2a633]/5 text-[#c2a633]',
                  desc: 'In-depth debate of platform mechanics vs legacy'
                },
                { 
                  id: 'conversion', 
                  title: 'CONVERSION', 
                  subtitle: 'Bottom of Funnel', 
                  color: 'hover:border-red-500/50', 
                  activeColor: 'border-red-500 bg-red-950/10 text-red-500',
                  desc: 'Urgent instruction to mint collectibles now!'
                },
                { 
                  id: 'retention', 
                  title: 'LOYAL / RETENTION', 
                  subtitle: 'Post-Funnel', 
                  color: 'hover:border-purple-500/50', 
                  activeColor: 'border-purple-500 bg-purple-950/10 text-purple-400',
                  desc: 'Secret code exploits and member leaks'
                }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleFunnelLevelChange(item.id as any)}
                  className={`p-3 border text-left rounded-xl transition-all cursor-pointer ${
                    funnelLevel === item.id 
                      ? item.activeColor 
                      : `border-neutral-900 bg-black/40 text-neutral-400 ${item.color}`
                  }`}
                >
                  <div className="font-orbitron font-black text-[10px] leading-tight tracking-wider uppercase">{item.title}</div>
                  <div className="text-[8px] text-neutral-500 mt-0.5 leading-none font-bold uppercase">{item.subtitle}</div>
                  <p className="text-[8px] text-neutral-550 leading-tight mt-1.5 font-normal line-clamp-2 md:block hidden">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card: Custom parameters & system prompts */}
          <div className="border border-neutral-900 bg-neutral-950/45 p-5 rounded-2xl flex flex-col gap-4">
            <span className="text-[9px] font-orbitron font-black text-neutral-500 uppercase tracking-widest block">
              ◤ CAMPAIGN TUNING LOGIC
            </span>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[8.5px] text-neutral-500 uppercase mb-1 font-bold">PRIMARY HOST PERSONALITY</label>
                <select
                  value={scriptHost}
                  onChange={(e) => setScriptHost(e.target.value)}
                  className="w-full bg-black border border-neutral-850 rounded p-2 text-xs text-neutral-350 outline-none focus:border-neutral-700 font-mono"
                >
                  <option value="DJ RED FANG">DJ RED FANG (Sultry Noir Radio Queen)</option>
                  <option value="ZEPHYR REBEL">ZEPHYR REBEL (Hacktivist Street Coder)</option>
                  <option value="PUCK MONOTONE">PUCK MONOTONE (Cold Synthesizer Engine AI)</option>
                  <option value="KORE SHIMMER">KORE SHIMMER (High Shimmer Space Announcer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] text-neutral-500 uppercase mb-1 font-bold">TARGET CHRONICLES / CUSTOM TOPIC</label>
                <textarea
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  rows={2}
                  placeholder="Enter detailed theme or core script logs..."
                  className="w-full bg-black border border-neutral-850 rounded p-2 text-xs text-[#00ffe6] outline-none font-mono resize-none focus:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[8.5px] text-neutral-500 uppercase mb-1 font-bold">PANELISTS CAPACITY</label>
                  <div className="text-[8.5px] text-[#c2a633] mt-1 uppercase font-bold tracking-widest truncate">
                    {panelists.join(', ')}
                  </div>
                </div>
                <div>
                  <label className="block text-[8.5px] text-neutral-500 uppercase mb-1 font-bold">TIMECODE LENGTH</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded p-1.5 text-[10px] text-neutral-450 outline-none focus:border-neutral-700 font-mono"
                  >
                    <option>Short (3 min)</option>
                    <option>Standard (15 min)</option>
                    <option>Extended Hour</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={launchTalkshow}
              disabled={isLoading || !topicPrompt.trim()}
              className="w-full py-3 mt-1 bg-gradient-to-b from-[#ff1a2e]/20 via-neutral-950 to-black hover:bg-[#ff1a2e] border border-[#ff1a2e] text-[#ff1a2e] hover:text-white font-orbitron font-extrabold text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(255,26,46,0.1)] disabled:opacity-50"
            >
              {isLoading ? "◤ CONNECTING SPECTRUM AGENTS (GEMINI)..." : "◤ LAUNCH SECURED RADIO SHOW"}
            </button>
          </div>

          {/* Quick FAQ info box */}
          <div className="p-4 border border-neutral-900 bg-black/30 rounded-xl flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="text-[8px] text-neutral-550 leading-normal uppercase">
              <span className="text-[#c2a633] font-bold block mb-1">MEMBER CONVERSION DECENTRALIZED PIPELINE</span>
              Synthesize a campaign discuss thread with Gemini. When ready, click "Compile Show as OAC Collectible" on the right to mint and add direct audio broadcasts right into local broadcast rotation channels!
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Broadcast Screen & Telemetry Monitor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="border-2 border-neutral-900 bg-[#060608]/90 rounded-2xl overflow-hidden relative min-h-[460px] flex flex-col justify-between">
            {/* Visual Header bar of the telemetry monitor */}
            <div className="p-4 border-b border-neutral-900 bg-black/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[8.5px] text-neutral-400 font-bold uppercase tracking-wider">◢ TRANSCRIPTION & SIGNAL SUBTITLES STREAM</span>
              </div>
              
              {/* Mute toggle button */}
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted) window.speechSynthesis?.cancel();
                }}
                className={`flex items-center gap-1.5 border px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isMuted 
                    ? "border-amber-900/55 bg-amber-950/15 text-amber-500" 
                    : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="h-2.5 w-2.5" />
                    SPEECH FEED MUTED
                  </>
                ) : (
                  <>
                    <Volume2 className="h-2.5 w-2.5 text-cyan-400" />
                    LIVE SPEECH FEED LIVE
                  </>
                )}
              </button>
            </div>

            {/* Main Interactive Stream body */}
            <div className="p-6 flex-1 flex flex-col justify-between gap-6 relative overflow-hidden bg-black/25">
              
              {/* Floating Live Reaction animation elements */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <AnimatePresence>
                  {audienceReactions.map(rx => (
                    <motion.div
                      key={rx.id}
                      initial={{ y: 350, opacity: 0, scale: 0.6, x: `${rx.x}%` }}
                      animate={{ y: 50, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1.2, 0.8] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.2, ease: "easeOut" }}
                      className="absolute text-sm font-bold bg-neutral-900/80 border border-neutral-800 rounded px-2 py-0.5 text-[#00f5ff] font-orbitron glitchy shadow-[0_0_12px_rgba(0,245,255,0.2)]"
                    >
                      {rx.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Speech & Transcript list area */}
              <div className="flex-1 flex flex-col justify-center min-h-[160px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                    <span className="text-[#00ffe6] text-[10px] uppercase tracking-widest animate-pulse font-normal">DECRYPTING SPECTRAL CHANNELS...</span>
                    <span className="text-[8px] text-neutral-500">Wait while Gemini lines up speech logs</span>
                  </div>
                ) : scriptResult.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin rounded p-1">
                    {scriptResult.map((line, idx) => {
                      const isActive = activeTurn === idx;
                      return (
                        <div
                          key={idx}
                          id={`line_${idx}`}
                          className={`p-3.5 rounded-xl border text-xs leading-normal transition-all duration-300 ${
                            isActive
                              ? "bg-neutral-950 border-[#00f5ff] text-white shadow-[0_0_15px_rgba(0,245,255,0.08)] scale-[1.01]"
                              : "bg-black/30 border-neutral-900/60 text-neutral-500 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-orbitron font-extrabold text-[#c2a633] text-[9px] uppercase tracking-wider">
                              ◤ {line.speaker}
                            </span>
                            {isActive && (
                              <span className="text-[7.5px] text-[#00f5ff] font-extrabold animate-pulse tracking-widest bg-[#00f5ff]/5 border border-[#00f5ff]/35 px-1.5 py-0.5 rounded leading-none flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-[#00f5ff] animate-ping" />
                                SPEAKING MICROPHONE ON
                              </span>
                            )}
                          </div>
                          <p className="italic leading-snug font-mono text-neutral-200">
                            {line.line}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-neutral-900 rounded-xl bg-neutral-950/20">
                    <span className="text-neutral-550 block font-orbitron text-[10px] font-black uppercase mb-1">◤ CHANNEL BUFFER DE-SYNCHRONIZED</span>
                    <p className="text-[9px] text-neutral-600 italic">Select funnel parameters on the left and trigger compilation uplink.</p>
                  </div>
                )}
              </div>

              {/* Active Playing Waveform representation */}
              {scriptResult.length > 0 && isPlaying && (
                <div className="h-7 border-t border-b border-neutral-900 bg-neutral-950/50 flex items-center justify-around px-8">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#00f5ff] rounded"
                      style={{
                        height: `${Math.floor(Math.random() * 16) + 6}px`,
                        animationName: 'orb-pulse',
                        animationDuration: `${Math.random() * 0.4 + 0.3}s`,
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'ease-in-out'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Playback Trigger bars */}
              {scriptResult.length > 0 && (
                <div className="flex items-center gap-3 border-t border-neutral-900/60 pt-4 mt-2">
                  <button
                    onClick={handlePlayToggle}
                    className={`flex items-center justify-center gap-2 flex-1 py-3 text-xs font-orbitron font-black tracking-widest border rounded-xl transition-all cursor-pointer ${
                      isPlaying
                        ? "bg-amber-950/20 border-amber-600 text-amber-500"
                        : "bg-[#00f5ff]/10 border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff] hover:text-black shadow-[0_0_15px_rgba(0,245,255,0.06)]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        PAUSE AUTOMATED TELECOMP
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        TRANSMIT SIGNAL AUDIO SYNTH
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Interaction Buttons - Audience metrics */}
            {scriptResult.length > 0 && (
              <div className="p-4 bg-black/75 border-t border-neutral-900 flex justify-between items-center gap-2 overflow-x-auto scrollbar-thin">
                <span className="text-[8px] text-neutral-500 font-bold block shrink-0 font-orbitron uppercase">LIVE REACTIONS:</span>
                <div className="flex gap-1.5">
                  <button onClick={() => throwReaction('🔥 MINT IT!')} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] hover:text-[#00f5ff] hover:border-neutral-700 font-bold transition-all shrink-0 cursor-pointer">🔥 MINT IT!</button>
                  <button onClick={() => throwReaction('🚀 MOON SPLIT')} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] hover:text-[#00f5ff] hover:border-neutral-700 font-bold transition-all shrink-0 cursor-pointer">🚀 MOON SPLIT</button>
                  <button onClick={() => throwReaction('💀 PENNY STREAMER')} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] hover:text-[#00f5ff] hover:border-neutral-700 font-bold transition-all shrink-0 cursor-pointer">💀 MONOPOLY EXPOSED</button>
                  <button onClick={() => throwReaction('🤖 FREQUENCY COMPLIANT')} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] hover:text-[#00f5ff] hover:border-neutral-700 font-bold transition-all shrink-0 cursor-pointer">🤖 COMPLIANT</button>
                </div>
              </div>
            )}
          </div>

          {/* BELOW Telemetry Screen: Mint Show Section (Dynamic OAC conversion) */}
          {scriptResult.length > 0 && (
            <div className="border border-neutral-900 bg-[#050508]/60 p-6 rounded-2xl">
              <h4 className="font-orbitron font-extrabold text-xs text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[#c2a633]">
                <Award className="h-4 w-4" />
                ◢ PERSIST THIS TALKSHOW AS AN OAC SINGLE
              </h4>
              <p className="text-[9px] text-neutral-500 leading-normal uppercase mb-4">
                Deploy these voice dialogues into the general 33.3FM Catalog. This initiates the standard creator agents pipeline, allowing other users to play your talk show in active rotation!
              </p>

              {/* Interactive log sequence */}
              {mintLogs.length > 0 && (
                <div className="bg-black/90 p-3 rounded-lg border border-neutral-900 mb-4 h-24 overflow-y-auto font-mono text-[8.5px] text-gray-400 space-y-0.5 scrollbar-thin">
                  {mintLogs.map((log, lIdx) => (
                    <div key={lIdx} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('BYPASS') ? 'text-cyan-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {wasMinted ? (
                <div className="p-4 bg-emerald-950/20 border-2 border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-bold text-center uppercase tracking-wide">
                  ✓ TALKSHOW FULLY PACKAGED & DEPLOYED ON-CHAIN! VIEW ROTATION IN BROADCAST DECK / CITIZENS CATALOG.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  
                  {/* Bypass secret control panel */}
                  <div className="w-full md:w-2/5 flex items-center gap-1 border border-neutral-850 p-1 rounded-lg bg-black/30">
                    <input
                      type="password"
                      value={evaluationBypass}
                      onChange={(e) => setEvaluationBypass(e.target.value)}
                      placeholder="Evaluator code bypass..."
                      className="bg-transparent border-none text-[9.5px] outline-none pl-2 py-1 text-white placeholder-neutral-600 font-mono w-full"
                    />
                    <button
                      onClick={handleBypassCodeCheck}
                      className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[8.5px] text-[#00f5ff] hover:text-white cursor-pointer hover:bg-neutral-850"
                    >
                      APPLY
                    </button>
                  </div>

                  {/* Mint button */}
                  <button
                    onClick={mintShowAsOacTrack}
                    disabled={isMinting}
                    className="flex-1 w-full py-3 bg-[#c2a633] text-black hover:bg-white hover:text-black font-orbitron font-extrabold text-xs tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(194,166,51,0.15)] disabled:opacity-50"
                  >
                    <Cpu className="h-4 w-4 animate-pulse" />
                    {isMinting ? "LAUNCHING PIPELINE SEEDS..." : isBypassed ? "◤ DEPLOY UNDERGROUND FREE OAC RELEASE" : `◤ MINT TALKSHOW OAC (⟁${MINT_COST.toLocaleString()} CREDITS)`}
                  </button>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
