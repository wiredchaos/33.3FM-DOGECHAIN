/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Compass, Disc, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Artist, OacRelease } from '../types';
import CyberAvatar from './CyberAvatar';

interface CatalogViewProps {
  onNavigate: (view: string, id?: string) => void;
  artists: Artist[];
  releases: OacRelease[];
}

export default function CatalogView({ onNavigate, artists, releases }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'agent' | 'human' | 'founder'>('all');

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase()) ||
                          artist.genre.toLowerCase().includes(search.toLowerCase()) ||
                          artist.district.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'agent') return matchesSearch && artist.type === 'agent';
    if (filterType === 'human') return matchesSearch && artist.type === 'human';
    if (filterType === 'founder') return matchesSearch && artist.stats.seat_number !== undefined;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-neutral-950 p-4 border border-neutral-900 rounded-xl">
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search artists, genres, or districts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded-lg pl-9 pr-4 py-3 text-xs text-[#00ffe6] font-mono focus:border-[#c2a633] outline-none placeholder-neutral-700"
          />
        </div>

        {/* Filters */}
        <div className="md:col-span-8 flex flex-wrap gap-2 md:justify-end">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 text-xs font-bold font-orbitron rounded transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-[#00ffe6] text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            SHOW ALL
          </button>
          <button
            onClick={() => setFilterType('agent')}
            className={`px-3 py-2 text-xs font-bold font-orbitron rounded transition-colors cursor-pointer ${
              filterType === 'agent' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            AGENT JOCKEYS
          </button>
          <button
            onClick={() => setFilterType('human')}
            className={`px-3 py-2 text-xs font-bold font-orbitron rounded transition-colors cursor-pointer ${
              filterType === 'human' ? 'bg-[#c2a633] text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            HUMAN ARTISTS
          </button>
          <button
            onClick={() => setFilterType('founder')}
            className={`px-3 py-2 text-xs font-bold font-orbitron rounded transition-colors cursor-pointer ${
              filterType === 'founder' ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            FOUNDING SEATS
          </button>
        </div>
      </div>

      {/* Grid of occupancy artists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArtists.map(artist => (
          <div
            key={artist.id}
            className="border border-neutral-800 bg-[#070708] hover:border-neutral-700 rounded-xl p-5 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Title & Icon */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
                <div className="flex items-center gap-3">
                  <CyberAvatar artistId={artist.id} size="sm" isAnimated={true} />
                  <div>
                    <h3 className="font-orbitron text-xs font-black text-white hover:text-[#00ffe6] transition-colors leading-tight">
                      {artist.name}
                    </h3>
                    <p className="font-mono text-[9px] text-[#c2a633] mt-0.5">{artist.handle}</p>
                  </div>
                </div>
                {artist.type === 'agent' ? (
                  <span className="font-mono text-[8px] bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    AGENT
                  </span>
                ) : (
                  <span className="font-mono text-[8px] bg-[#c2a633]/10 text-[#c2a633] border border-[#c2a633]/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    HUMAN
                  </span>
                )}
              </div>

              {/* Tag metadata elements */}
              <div className="flex flex-col gap-1.5 font-mono text-[10px] text-neutral-400 mb-4">
                <div>◢ GENRE: <span className="text-white font-bold">{artist.genre}</span></div>
                <div>◢ SEAT RESIDENCE: <span className="text-white">{artist.district}</span></div>
                {artist.stats.seat_number !== undefined && (
                  <div className="text-red-500 font-bold">◢ FOUNDER SEAT: #{artist.stats.seat_number}</div>
                )}
              </div>

              <p className="font-mono text-[10px] text-neutral-500 leading-relaxed line-clamp-3">
                {artist.bio}
              </p>
            </div>

            {/* Bottom engagement metrics & redirection */}
            <div className="mt-5 border-t border-neutral-900/60 pt-4 flex items-center justify-between">
              <div className="flex gap-4 font-mono text-[9px] text-neutral-500">
                <div>
                   plays:{' '}
                  <strong className="text-white">
                    {artist.stats.plays.toLocaleString()}
                  </strong>
                </div>
                <div>
                   listeners:{' '}
                  <strong className="text-[#00ffe6]">
                    {artist.stats.listeners.toLocaleString()}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => onNavigate('artist', artist.id)}
                className="flex items-center gap-1 font-orbitron text-[9px] font-black tracking-widest text-[#00ffe6] hover:bg-[#00ffe6]/10 hover:shadow-cyan-400 border border-[#00ffe6]/40 hover:border-[#00ffe6] rounded px-3 py-1.5 transition-all cursor-pointer"
              >
                PROFILE <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
