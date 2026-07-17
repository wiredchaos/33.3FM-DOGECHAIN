/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Coins, CheckCircle, Play, Settings, AlertTriangle, Cpu, Globe, Key } from 'lucide-react';
import { Artist, OacRelease, RadioTrack } from '../types';
import { buildCompletedAgents } from '../utils/seed';

interface MintViewProps {
  onNavigate: (view: string, id?: string) => void;
  artists: Artist[];
  releases: OacRelease[];
  setReleases: React.Dispatch<React.SetStateAction<OacRelease[]>>;
  setTracks: React.Dispatch<React.SetStateAction<RadioTrack[]>>;
}

export default function MintView({
  onNavigate,
  artists,
  releases,
  setReleases,
  setTracks
}: MintViewProps) {
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [genre, setGenre] = useState('Phonk');
  const [bpm, setBpm] = useState(120);
  const [keyScale, setKeyScale] = useState('A minor');
  const [chains, setChains] = useState<('sol' | 'base' | 'doge')[]>(['sol', 'base']);
  const [ddexTargets, setDdexTargets] = useState<string[]>(['spotify', 'apple', 'youtube']);
  const [bypassCode, setBypassCode] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);

  // OAC Pipeline State
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0-8 steps
  const [pipelineCompleted, setPipelineCompleted] = useState(false);
  const [newlyMintedId, setNewlyMintedId] = useState('');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const MINT_COST = 5000;

  const AGENT_ORDER = [
    { id: 'release', name: 'RELEASE AGENT', role: 'ISRC/UPC Metadata & DDEX Packaging' },
    { id: 'rights', name: 'RIGHTS AGENT', role: 'Mechanical & Performance Registrations' },
    { id: 'pitch', name: 'PITCH AGENT', role: 'Playlist & Curators Outreach Campaign' },
    { id: 'marketing', name: 'MARKETING AGENT', role: 'Social Media Promos & Pre-saves' },
    { id: 'royalty', name: 'ROYALTY AGENT', role: 'On-Chain Allocation & Financial Splits' },
    { id: 'fan', name: 'FAN ENGAGEMENT AGENT', role: 'Exclusive merchandise & V33 drops' },
    { id: 'compliance', name: 'COMPLIANCE AGENT', role: 'Origin and C2PA cryptographic stamp' },
    { id: 'insights', name: 'INSIGHTS AGENT', role: 'Genre indexing & Stream Performance Predictions' }
  ];

  useEffect(() => {
    if (artists.length && !selectedArtistId) {
      setSelectedArtistId(artists[0].id);
    }
  }, [artists, selectedArtistId]);

  const handleBypassCheck = () => {
    if (bypassCode.trim() === 'WC-MUSICATHON-2026') {
      setIsBypassed(true);
      triggerConsoleLog('HACKATHON EVALUATOR KEY DETECTED. ⟁5,000 FEE WAIVED FOR DEMO.');
    } else {
      setIsBypassed(false);
    }
  };

  const triggerConsoleLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setPipelineLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Run the 8-Agent pipeline sequentially
  const startOacPipeline = () => {
    if (!trackTitle.trim()) {
      alert('Enter a Track Title first.');
      return;
    }
    if (!(window as any).XentsChange) {
      alert('Xents Change Machine is not loaded.');
      return;
    }

    const artist = artists.find(a => a.id === selectedArtistId);
    if (!artist) {
      alert('Select an occupying Artist first.');
      return;
    }

    // Step 1: Charge standard fee unless bypassed
    if (!isBypassed) {
      const balance = (window as any).XentsChange.balance();
      if (balance < MINT_COST) {
        // Trigger automated top up open gateway
        (window as any).XentsChange.open({
          context: 'mint-gate',
          minBalance: MINT_COST,
          reason: `Minting on-chain release requires ⟁${MINT_COST.toLocaleString()} ($50.00). Keep the ecosystem balanced!`,
          onSuccess: () => startOacPipeline()
        });
        return;
      }

      // Spend standard amount
      const spent = (window as any).XentsChange.spend({
        amount: MINT_COST,
        label: `MINT RELEASE: ${trackTitle.toUpperCase()}`,
        category: 'mint'
      });
      if (!spent) return;
    }

    // Trigger pipeline start
    setPipelineRunning(true);
    setPipelineCompleted(false);
    setPipelineStep(0);
    setPipelineLogs([]);

    triggerConsoleLog(`LAUNCHING OAC PIPELINE DAG BLOCK FOR TITLE: "${trackTitle.toUpperCase()}"`);
    triggerConsoleLog(`CONVERGING NETWORKS FOR ASSET DISTRIBUTION: [${chains.join(', ').toUpperCase()}]`);

    runStep(0, artist);
  };

  const runStep = (stepIdx: number, citizen: Artist) => {
    if (stepIdx >= AGENT_ORDER.length) {
      // Pipeline Finished! Commit release & track to shared states
      setTimeout(() => {
        const releaseId = `rel_${Date.now()}`;
        const newRelease: OacRelease = {
          id: releaseId,
          trackTitle,
          artist: citizen.name,
          artistId: citizen.id,
          audioUrl: null,
          distribution: {
            mintChains: chains,
            ddexTargets
          },
          meta: {
            bpm,
            key: keyScale,
            genre,
            durationSec: 180 + Math.floor(Math.random() * 60)
          },
          status: 'complete',
          startedAt: Date.now() - 30000,
          updatedAt: Date.now(),
          completedAt: Date.now(),
          agents: buildCompletedAgents({ title: trackTitle } as any, citizen)
        };

        const newRadioTrack: RadioTrack = {
          title: trackTitle,
          artist: citizen.name,
          district: citizen.district,
          bpm,
          key: keyScale,
          chain: chains[0] || 'multi',
          status: 'rotation',
          ingested: Date.now(),
          oacRelease: true,
          mintedAt: Date.now()
        };

        // State & LocalStorage persistence
        setReleases(prev => [newRelease, ...prev]);
        setTracks(prev => [newRadioTrack, ...prev]);

        // Push to local storage
        try {
          const currentRels = JSON.parse(localStorage.getItem('wc_oac_releases') || '[]');
          localStorage.setItem('wc_oac_releases', JSON.stringify([newRelease, ...currentRels]));

          const currentTracks = JSON.parse(localStorage.getItem('wc_radio_tracks') || '[]');
          localStorage.setItem('wc_radio_tracks', JSON.stringify([newRadioTrack, ...currentTracks]));
        } catch (e) {}

        triggerConsoleLog('OAC PIPELINE DAG EXECUTION CODE 200: COMPLETED SUCCESSFULLY!');
        triggerConsoleLog(`UPC: 88472948194 | ISRC: WC-33FM-${Math.floor(Math.random() * 80000) + 10000}`);
        triggerConsoleLog(`TRACK INGESTED TO BROADCAST ROUTER MATRIX SUCCESSFULLY.`);

        // Artist releases count increments
        artists.map(a => {
          if (a.id === citizen.id) {
            a.stats.releases += 1;
          }
        });

        setNewlyMintedId(releaseId);
        setPipelineCompleted(true);
        setPipelineRunning(false);
      }, 1000);
      return;
    }

    setPipelineStep(stepIdx);
    const agent = AGENT_ORDER[stepIdx];
    triggerConsoleLog(`CONVENING AGENT: [${agent.name}] TO SECURE CONTRACTS...`);

    const agentPhrases = [
      `Filing metadata and computing unique master fingerprints.`,
      `Securing publishing registry matching metadata files.`,
      `Analyzing pitch vocabulary to construct perfect playlist submissions.`,
      `Launching customized pre-sell page and staging creative cards.`,
      `Adjusting revenue split decimals directly on Base/Solana contract parameters.`,
      `Publishing gated merchandise coupons for VAULT33 members.`,
      `Signing ledger with immutable C2PA origin hash stamps.`,
      `Assessing stream thresholds from competitor metrics.`
    ];

    setTimeout(() => {
      triggerConsoleLog(`[${agent.id.toUpperCase()}] SUCCESS: ${agentPhrases[stepIdx]}`);
      runStep(stepIdx + 1, citizen);
    }, 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT FORM FIELD CONTROLS */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="border border-neutral-800 bg-neutral-950 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#c2a633] to-transparent animate-pulse" />

          <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-5">
            <h2 className="font-orbitron font-extrabold text-lg text-white tracking-widest uppercase">
              ◢ MINT A RELEASE
            </h2>
            <div className="text-[10px] font-mono text-[#c2a633]">
              STATUS // ONE DEPOSIT, 150+ PORTAL STORES
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase">
                occupying Artist
              </label>
              <select
                value={selectedArtistId}
                onChange={e => setSelectedArtistId(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded p-3 text-sm text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
              >
                {artists.map(a => (
                  <option key={a.id} value={a.id} className="bg-neutral-950">
                    {a.name} ({a.handle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase">
                Track Title
              </label>
              <input
                type="text"
                value={trackTitle}
                onChange={e => setTrackTitle(e.target.value)}
                placeholder="e.g. MOON SHOT PROTOCOL"
                className="w-full bg-black border border-neutral-800 rounded p-3 text-sm text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none placeholder-neutral-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase">
                  Primary Genre
                </label>
                <select
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded p-3 text-sm text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                >
                  <option>Phonk</option>
                  <option>Drill</option>
                  <option>Synthwave</option>
                  <option>Lo-fi</option>
                  <option>Ambient</option>
                  <option>Experimental</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase text-center">
                    BPM
                  </label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={e => setBpm(Number(e.target.value))}
                    className="w-full bg-black border border-neutral-800 rounded p-3 text-sm text-center text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase text-center">
                    KEY
                  </label>
                  <input
                    type="text"
                    value={keyScale}
                    onChange={e => setKeyScale(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded p-3 text-sm text-center text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none placeholder-neutral-700"
                    placeholder="A min"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Audio File Selector */}
            <div>
              <label className="block text-xs font-orbitron text-neutral-400 mb-1.5 uppercase">
                Upload Master File (WAV, FLAC)
              </label>
              <div className="border-2 border-dashed border-neutral-800 bg-black/40 hover:border-[#00ffe6] transition-colors p-6 rounded text-center cursor-pointer">
                <Upload className="h-8 w-8 text-[#00ffe6] mx-auto mb-2 animate-pulse" />
                <span className="font-mono text-xs text-neutral-400 block mb-1">
                  DRAG & DROP MASTER TRANSCRIPT ASSET
                </span>
                <span className="font-mono text-[9px] text-[#c2a633]">
                  MAX FILE SIZE 100MB (STORES SECURELY IPFS)
                </span>
              </div>
            </div>

            {/* Advanced configurations */}
            <div className="border border-neutral-900 bg-black/40 p-3.5 rounded flex items-center justify-between">
              <span className="font-mono text-xs text-neutral-400 uppercase">
                SETUP ROYALTY DUAL CONSENT ALLOCATIONS (85/15 ratio)
              </span>
              <Settings className="h-4 w-4 text-neutral-500 hover:text-white transition-colors cursor-pointer" />
            </div>

            {/* Hackathon check bypass */}
            <div className="border border-neutral-900 bg-neutral-950 p-4 rounded flex flex-col md:flex-row gap-3 items-center">
              <div className="flex-1">
                <label className="block text-[9px] font-orbitron text-[#c2a633] uppercase">
                  Judge Bypass Access Key
                </label>
                <input
                  type="text"
                  placeholder="WC-MUSICATHON-2026"
                  value={bypassCode}
                  onChange={e => setBypassCode(e.target.value)}
                  className="w-full bg-black border border-neutral-900 rounded p-2 text-xs text-[#00ffe6] font-mono outline-none placeholder-neutral-800"
                />
              </div>
              <button
                onClick={handleBypassCheck}
                className="w-full md:w-auto mt-4 md:mt-2 py-2 px-4 border border-[#c2a633] text-[#c2a633] hover:bg-[#c2a633] hover:text-black font-bold font-orbitron text-xs transition-all cursor-pointer"
              >
                APPLY CODE
              </button>
            </div>

            {/* Cost Checkout Trigger */}
            <button
              onClick={startOacPipeline}
              disabled={pipelineRunning}
              className={`w-full py-4 border-2 font-orbitron font-black text-xs tracking-widest text-[#000] cursor-pointer shadow-lg active:translate-y-0.5 transition-all outline-none ${
                pipelineRunning
                  ? 'bg-neutral-800 border-neutral-800 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-400 hover:from-emerald-300 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
              }`}
            >
              {pipelineRunning
                ? 'COMPUTING AGENT CONTRACTS...'
                : `◤ INITIATE OPEN AGENTIC COMMERCE RELEASE [ ⟁ ${isBypassed ? '0 (WAIVED)' : '5,000'} ]`}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PIPELINE PROGRESS */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="border border-neutral-800 bg-black/60 p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <span className="font-orbitron font-black text-xs text-[#00ffe6] tracking-[0.2em] uppercase">
              ◢ OAC PIPELINE STATUS
            </span>
            <Cpu className="h-4 w-4 text-[#00ffe6]" />
          </div>

          <div className="flex flex-col gap-4">
            {AGENT_ORDER.map((agent, index) => {
              const active = pipelineStep === index && pipelineRunning;
              const complete = (pipelineStep > index || pipelineCompleted) && pipelineRunning || pipelineCompleted;
              return (
                <div
                  key={agent.id}
                  className={`p-3 border rounded transition-all flex items-center gap-3 ${
                    active
                      ? 'bg-neutral-900/60 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse'
                      : complete
                      ? 'bg-neutral-950/20 border-emerald-500 text-emerald-400'
                      : 'bg-neutral-950/30 border-neutral-900 text-neutral-600'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      active
                        ? 'border-yellow-500 text-yellow-500'
                        : complete
                        ? 'border-emerald-500 bg-emerald-500 text-black'
                        : 'border-neutral-800 text-neutral-700'
                    }`}
                  >
                    {complete ? '✓' : index + 1}
                  </div>
                  <div>
                    <h4 className="font-orbitron text-xs font-black tracking-wide uppercase">
                      {agent.name}
                    </h4>
                    <p className="font-mono text-[9px] mt-0.5 opacity-80">
                      {agent.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOG LINES PANEL */}
        {pipelineRunning || pipelineCompleted ? (
          <div className="border border-neutral-800 bg-neutral-950 p-4 rounded-xl">
            <h3 className="font-orbitron font-bold text-[10px] text-neutral-400 mb-2 uppercase">
              ◢ OAC LOG PIPELINE STREAM
            </h3>
            <div className="h-48 overflow-y-auto font-mono text-[9px] text-[#00ffe6]/80 leading-relaxed">
              {pipelineLogs.map((log, idx) => (
                <div key={idx} className="hover:bg-neutral-900/40 p-0.5 rounded">
                  {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-neutral-800 bg-neutral-950/20 p-6 rounded-xl text-center text-neutral-500 font-mono text-xs">
            ◢ EXECUTE MINT TO ACTIVATE OAC AGENT PIPELINE OVERVIEW
          </div>
        )}
      </div>
    </div>
  );
}
