# Hermes Streaming TTS Adoption — 33.3FM

**Status:** Architecture adopted; implementation verification required  
**Canonical specification:** https://github.com/wiredchaos/agentropolis/blob/main/docs/HERMES_STREAMING_TTS.md

33.3FM uses the AGENTROPOLIS Voice Transit Layer for live hosts, DJ links, bulletins, station IDs, narration, and interactive broadcasts.

```text
LLM token stream -> safe clause splitter -> Voice Gateway -> streaming TTS adapter -> PCM chunks -> broadcast output
```

Requirements:

- Begin speech only after a safe, semantically complete clause.
- Route all providers through the shared Voice Gateway.
- Preserve whole-file and text fallbacks.
- Support interruption, mute, cancel, and human takeover.
- Keep provider credentials outside prompts, browser code, logs, and transcripts.
- Do not publish unreviewed private data, tool instructions, or consequential commands through speech.
- Retain raw audio and transcripts only with policy and consent.
- Mark synthetic voices and prohibit unauthorized impersonation.

Production readiness requires measured first-audio latency, reliable fallback, prompt and secret isolation, interruption testing, and an auditable session receipt.
