import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Cpu, Sparkles, Radio, Music, Users, ArrowRight, X, Command } from 'lucide-react';
import { Artist, OacRelease, RadioTrack } from '../types';

interface GlobalSearchProps {
  artists: Artist[];
  releases: OacRelease[];
  tracks: RadioTrack[];
  onNavigate: (view: 'brand' | 'broadcast' | 'mint' | 'catalog' | 'artist' | 'studio' | 'motion' | 'talkshow', id?: string) => void;
  onOpenXents?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'SYSTEMS' | 'ARTISTS' | 'TRACKS';
  action: () => void;
  badge?: string;
  badgeColor?: string;
}

export default function GlobalSearch({
  artists,
  releases,
  tracks,
  onNavigate,
  onOpenXents
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search results if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to CMD+K or / keyboard shortcuts to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectResult = (action: () => void) => {
    action();
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Compile full search results in real-time
  const getFilteredResults = (): SearchResult[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    // 1. Static Feature Navigation and Tool Shortcuts matching
    const features: { title: string; subtitle: string; kw: string[]; action: () => void; badge?: string; badgeColor?: string }[] = [
      {
        title: 'THE SIGNAL (BRAND HUB)',
        subtitle: 'Platform analytics, brand bible vertical and visual shield system.',
        kw: ['brand', 'hub', 'dashboard', 'analytics', 'landing', 'shield', 'home'],
        action: () => onNavigate('brand')
      },
      {
        title: 'BROADCAST DECK',
        subtitle: 'Live streaming player, audio nodes scheduler, and frequency controller.',
        kw: ['broadcast', 'player', 'stream', 'listen', 'radio', 'deck', 'music'],
        action: () => onNavigate('broadcast')
      },
      {
        title: 'OAC RELEASE PORTAL',
        subtitle: 'Mint tracks as On-Chain Audio Collectibles via the 8-Agent pipeline.',
        kw: ['mint', 'release', 'agency', 'oac', 'pipeline', 'publish', 'tokenize'],
        action: () => onNavigate('mint')
      },
      {
        title: 'CITIZENS CATALOG',
        subtitle: 'Digital profiles database of sovereign network occupant artists.',
        kw: ['catalog', 'artists', 'human', 'ai', 'occupants', 'profiles', 'founders'],
        action: () => onNavigate('catalog')
      },
      {
        title: 'STUDIO CONSOLE',
        subtitle: 'Lyria Studio generation, 3D SignalBeat sequencer, scheduling deck.',
        kw: ['studio', 'console', 'lyria', 'signalbeat', 'mixer', 'drum', 'synthesizer'],
        action: () => onNavigate('studio')
      },
      {
        title: 'AI TALKSHOW GENERATOR',
        subtitle: 'Launch conversational radio shows based on funnel conversion levels.',
        kw: ['talkshow', 'funnel', 'roundtable', 'show', 'ai', 'podcast', 'gemini', 'debate'],
        action: () => onNavigate('talkshow'),
        badge: 'NEW',
        badgeColor: 'text-[#ff1a2e] border-[#ff1a2e]/40 bg-[#ff1a2e]/5'
      },
      {
        title: 'MOTION CORE',
        subtitle: 'Fable5 Motion System, ambient canvas diagnostics, and animators sandbox.',
        kw: ['motion', 'chaos', 'sandbox', 'diagnostics', 'telemetry', 'fable5'],
        action: () => onNavigate('motion')
      },
      {
        title: 'XENTS CHANGE MACHINE',
        subtitle: 'Top up sovereign credits, swap chains, and view automated transaction ledger.',
        kw: ['xents', 'credits', 'changer', 'coins', 'token', 'ledger', 'swap', 'balance'],
        action: () => {
          if (onOpenXents) onOpenXents();
        }
      }
    ];

    // Filter features
    features.forEach((f, idx) => {
      const matches = searchTerms.every(term => 
        f.title.toLowerCase().includes(term) || 
        f.subtitle.toLowerCase().includes(term) || 
        f.kw.some(k => k.includes(term))
      );
      if (matches) {
        results.push({
          id: `feature_${idx}`,
          title: f.title,
          subtitle: f.subtitle,
          category: 'SYSTEMS',
          action: f.action,
          badge: f.badge,
          badgeColor: f.badgeColor
        });
      }
    });

    // 2. Real-time matching on Artists
    artists.forEach(artist => {
      const matches = searchTerms.every(term => 
        artist.name.toLowerCase().includes(term) || 
        artist.genre.toLowerCase().includes(term) || 
        artist.district.toLowerCase().includes(term) ||
        (artist.genre_secondary && artist.genre_secondary.toLowerCase().includes(term))
      );
      if (matches) {
        results.push({
          id: `artist_${artist.id}`,
          title: artist.name.toUpperCase(),
          subtitle: `${artist.type.toUpperCase()} OCCUPANT · ${artist.genre} · Sector: ${artist.district}`,
          category: 'ARTISTS',
          action: () => onNavigate('artist', artist.id),
          badge: artist.type === 'agent' ? 'AI' : 'HUMAN',
          badgeColor: artist.type === 'agent' ? 'text-cyan-400 border-cyan-800 bg-cyan-950/20' : 'text-gray-400 border-gray-800 bg-gray-900/10'
        });
      }
    });

    // 3. Real-time matching on Tracks & Releases
    releases.forEach(rel => {
      const matches = searchTerms.every(term => 
        rel.trackTitle.toLowerCase().includes(term) || 
        rel.artist.toLowerCase().includes(term)
      );
      if (matches) {
        results.push({
          id: `release_${rel.id}`,
          title: rel.trackTitle.toUpperCase(),
          subtitle: `OAC Release by ${rel.artist} (${rel.status.toUpperCase()})`,
          category: 'TRACKS',
          action: () => onNavigate('mint'),
          badge: 'MINTED OAC',
          badgeColor: 'text-[#c2a633] border-[#c2a633]/40 bg-[#c2a633]/5'
        });
      }
    });

    // Loop through rotation radio tracks
    tracks.forEach((track, idx) => {
      const matches = searchTerms.every(term => 
        track.title.toLowerCase().includes(term) || 
        track.artist.toLowerCase().includes(term)
      );
      const isAlreadyAdded = results.some(r => r.title.toUpperCase() === track.title.toUpperCase());
      if (matches && !isAlreadyAdded) {
        results.push({
          id: `track_${idx}`,
          title: track.title.toUpperCase(),
          subtitle: `Rotation Song by ${track.artist} · Key: ${track.key} (${track.bpm} BPM)`,
          category: 'TRACKS',
          action: () => onNavigate('broadcast'),
          badge: 'ON AIR',
          badgeColor: 'text-emerald-400 border-emerald-950 bg-emerald-950/20'
        });
      }
    });

    return results;
  };

  const filteredResults = getFilteredResults();
  const systemsResults = filteredResults.filter(r => r.category === 'SYSTEMS');
  const artistsResults = filteredResults.filter(r => r.category === 'ARTISTS');
  const tracksResults = filteredResults.filter(r => r.category === 'TRACKS');

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm font-mono text-xs z-55">
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search features, artists, OACs..."
          className="w-full bg-black/60 border border-neutral-900 rounded-lg py-1.5 pl-9 pr-14 text-xs text-white placeholder-neutral-550 outline-none focus:border-[#00ffe6]/50 focus:bg-black/95 transition-all shadow-[inset_0_1px_5px_rgba(0,0,0,0.8)]"
        />
        {query ? (
          <button 
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3.5 text-neutral-500 hover:text-white cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <div className="absolute right-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-bold text-[8px] text-neutral-500 select-none pointer-events-none">
            <Command className="h-2 w-2" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Suggestion & Results Dropdown Box */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#050508] border border-neutral-900 rounded-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.95)] max-h-[380px] overflow-y-auto scrollbar-thin">
          {filteredResults.length === 0 ? (
            <div className="p-5 text-center text-neutral-600 bg-neutral-950/20">
              <span className="text-[#ff1a2e] text-[10px] font-orbitron block font-black uppercase mb-1">◤ SECTOR D7 SIGNALS DE-SYNCHRONIZED</span>
              <p className="text-[9px] italic text-neutral-500">No occupant artists or radio parameters matched "{query}"</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-900/60">
              {/* Category 1: Systems & Features */}
              {systemsResults.length > 0 && (
                <div className="p-2 bg-neutral-950/40">
                  <span className="block text-[8px] font-orbitron font-extrabold text-[#00f5ff]/70 tracking-widest px-2.5 py-1 uppercase">◢ SYSTEMS & CORE CHANNELS</span>
                  <div className="mt-1 space-y-0.5">
                    {systemsResults.map(res => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectResult(res.action)}
                        className="w-full text-left p-2 hover:bg-neutral-900/60 rounded flex items-start gap-2.5 transition-all text-neutral-300 hover:text-white cursor-pointer group"
                      >
                        <Cpu className="h-3.5 w-3.5 text-[#00f5ff] mt-0.5 shrink-0 group-hover:animate-pulse" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold font-orbitron tracking-wide leading-tight">{res.title}</span>
                            {res.badge && (
                              <span className={`text-[8px] border px-1 rounded-sm leading-none font-bold uppercase shrink-0 ${res.badgeColor}`}>
                                {res.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-neutral-500 truncate leading-tight mt-0.5">{res.subtitle}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-neutral-600 shrink-0 self-center hidden group-hover:block" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Occupant Artists */}
              {artistsResults.length > 0 && (
                <div className="p-2 bg-neutral-950/20">
                  <span className="block text-[8px] font-orbitron font-extrabold text-[#ff1a2e]/70 tracking-widest px-2.5 py-1 uppercase">◢ OCCUPANT CITIZENS</span>
                  <div className="mt-1 space-y-0.5">
                    {artistsResults.map(res => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectResult(res.action)}
                        className="w-full text-left p-2 hover:bg-neutral-900/60 rounded flex items-start gap-2.5 transition-all text-neutral-300 hover:text-white cursor-pointer group"
                      >
                        <Users className="h-3.5 w-3.5 text-[#ff1a2e] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold font-orbitron tracking-wide leading-tight">{res.title}</span>
                            {res.badge && (
                              <span className={`text-[7px] border px-1 rounded-sm leading-none font-black uppercase shrink-0 ${res.badgeColor}`}>
                                {res.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-neutral-500 truncate leading-tight mt-0.5">{res.subtitle}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-neutral-600 shrink-0 self-center hidden group-hover:block" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Tracks & Releases */}
              {tracksResults.length > 0 && (
                <div className="p-2 bg-neutral-900/10">
                  <span className="block text-[8px] font-orbitron font-extrabold text-[#c2a633]/70 tracking-widest px-2.5 py-1 uppercase">◢ SOUNDWAVES & ON-CHAIN RELEASES</span>
                  <div className="mt-1 space-y-0.5">
                    {tracksResults.map(res => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectResult(res.action)}
                        className="w-full text-left p-2 hover:bg-neutral-900/60 rounded flex items-start gap-2.5 transition-all text-neutral-300 hover:text-white cursor-pointer group"
                      >
                        <Music className="h-3.5 w-3.5 text-[#c2a633] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold font-orbitron tracking-wider leading-tight">{res.title}</span>
                            {res.badge && (
                              <span className={`text-[7px] border px-1 rounded-sm leading-none font-bold uppercase shrink-0 ${res.badgeColor}`}>
                                {res.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-neutral-500 truncate leading-tight mt-0.5">{res.subtitle}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-neutral-600 shrink-0 self-center hidden group-hover:block" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="p-1 px-3 bg-neutral-950 border-t border-neutral-900 flex justify-between items-center text-[7.5px] text-neutral-600">
            <span>PRESS ESC TO DISMISS SPECTRAL DECK</span>
            <span>RESULTS FOUND: {filteredResults.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
