/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SonicProfile {
  bpm_range: [number, number];
  key_bias: string[];
  palette: string[];
  references: string[];
  mood_vocab: string[];
}

export interface Socials {
  x?: string;
  sc?: string;
  site?: string;
}

export interface ArtistStats {
  plays: number;
  listeners: number;
  releases: number;
  seat_number?: number;
}

export interface Artist {
  id: string;
  name: string;
  handle: string;
  type: 'agent' | 'human';
  tier?: 'flagship' | 'standard';
  role?: string;
  genre: string;
  genre_secondary?: string;
  bio: string;
  catchphrase?: string;
  artist_statement?: string;
  sonic_profile?: SonicProfile;
  district: string;
  district_color: string;
  slot?: string;
  founded: string;
  socials?: Socials;
  stats: ArtistStats;
  avatar_color: string;
  avatar_glyph: string;
  brand_bible?: string;
}

export interface OacAgentState {
  status: 'pending' | 'queued' | 'running' | 'complete' | 'failed';
  startedAt?: number;
  runningAt?: number;
  completedAt?: number;
  output?: Record<string, string | number>;
}

export interface OacDistribution {
  mintChains: ('sol' | 'base' | 'doge')[];
  ddexTargets: string[];
}

export interface OacReleaseMeta {
  bpm?: number;
  key?: string;
  mood?: string;
  genre?: string;
  durationSec?: number;
  source?: string;
}

export interface OacRelease {
  id: string;
  trackTitle: string;
  artist: string;
  artistId: string;
  audioUrl: string | null;
  distribution: OacDistribution;
  meta?: OacReleaseMeta;
  status: 'running' | 'complete' | 'failed';
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  agents: Record<string, OacAgentState>;
  _celebrated?: boolean;
}

export interface RadioTrack {
  title: string;
  artist: string;
  district: string;
  bpm: number;
  key: string;
  chain: 'sol' | 'base' | 'doge' | 'multi';
  status: 'live' | 'queued' | 'rotation';
  ingested: number;
  oacRelease?: boolean;
  mintedAt?: number;
}

export interface Show {
  time: string;
  title: string;
  host: string;
  type: 'LIVE' | 'PRE-RECORDED' | 'VAULT33 GATED' | 'SIMULCAST → ATV';
  duration: number;
  description: string;
  status: 'live' | 'queued' | 'done';
  created: number;
}

export interface Split {
  chain: 'base' | 'doge' | 'sol';
  addr: string;
  pct: number;
  label: string;
}

export interface SplitConfig {
  scope: string;
  trigger: string;
  splits: Split[];
  saved: number;
}

export interface LedgerEntry {
  ts: number;
  type: 'deposit' | 'spend' | 'bonus';
  label: string;
  rail?: string;
  usd?: number;
  xents: number;
  category?: string;
}

export interface TreasuryStats {
  circulating: number;
  backing: number;
  volume24h: number;
  holders: number;
}

export interface FounderApplication {
  id: string;
  name: string;
  handle: string;
  email: string;
  genre: string;
  listeners: string;
  releases: number;
  track: string;
  why: string;
  interests: string[];
  wallet?: string;
  socials?: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'declined';
}
