# Pocket TTS Local Voice Integration

Status: candidate local/offline voice engine for 33.3FM DOGECHAIN.

Pocket TTS is being tracked as a possible local speech layer for radio production because the discovery notes describe it as CPU-first, lightweight, stream-capable, and usable through a Python API/CLI.

## 33.3FM usage

Potential voice jobs:

- DJ RED FANG station IDs
- episode bumpers
- show intros and outros
- automated interstitials
- emergency/fallback narration
- local draft reads before final production
- offline radio mode

## Placement

This repo should not own the core TTS engine.

33.3FM should call the AGENTROPOLIS voice gateway. The voice gateway decides whether to use Pocket TTS, a mock voice, or an optional hosted fallback.

## Persona map

Initial persona slots:

- `red-fang`: pirate radio host voice
- `station-id`: short branded tags
- `field-signal`: quick transmission voice
- `generic`: plain narration fallback

## Guardrails

- Do not claim a real person's voice without permission.
- Do not use voice cloning unless source audio rights are documented.
- Do not make Pocket TTS mandatory until benchmarks pass.
- Keep generated audio clearly synthetic when needed.

## Validation needs

Before production use:

- confirm install/package commands
- confirm license and commercial usage
- test latency on CPU-only hardware
- test long-form radio reads
- compare output against hosted TTS options
- confirm streaming behavior

## Current status

Tracked for evaluation. Not production locked.
