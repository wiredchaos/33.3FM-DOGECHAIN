# MRT2 LICENSE ANALYSIS — COMMERCIAL USE POSTURE

> **Verdict: FULL GREEN LIGHT.** Magenta RealTime 2 is one of the most commercial-friendly open-weights music models released to date. You can build paid products on top of it, mint its outputs as NFTs, redistribute fine-tunes, and sell hosted access. No revenue-share, no royalty obligation, no field-of-use restriction.

---

## ⟁ LICENSE STRUCTURE

MRT2 is dual-licensed. Different artifacts get different licenses:

| Artifact | License | Commercial Use | Modification | Redistribution |
|---|---|---|---|---|
| **Python codebase** (`magenta-realtime`) | Apache 2.0 | ✅ Permitted | ✅ Permitted | ✅ Permitted |
| **Model weights** (open-weights checkpoints) | CC-BY 4.0 International | ✅ Permitted | ✅ Permitted | ✅ Permitted |
| **Outputs** (audio you generate) | NO RIGHTS CLAIMED | ✅ Yours fully | N/A | ✅ Yours fully |

This is the same structure as Stable Diffusion + the OpenRAIL licenses, but **without the ethics clauses that some open-weight licenses use to restrict commercial use**. Both Apache 2.0 and CC-BY 4.0 are battle-tested in court. They mean what they say.

---

## ⟁ CRITICAL CLAUSE — OUTPUT OWNERSHIP

Direct from the GitHub LICENSE statement:

> *"Google claims no rights in outputs you generate using Magenta RealTime. You and your users are solely responsible for outputs and their subsequent uses."*

This is the entire ballgame. Translation:

- ✅ Mint MRT2-generated audio as NFTs on SOL / BASE / DOGE — yours.
- ✅ Sell MRT2-generated tracks via DDEX to Spotify / Apple / YouTube — yours.
- ✅ License MRT2-generated tracks for sync (film, ads, games) — yours.
- ✅ Fine-tune MRT2 on a private dataset and sell access to the fine-tune — yours.
- ✅ Wrap MRT2 in a paid app and charge $XENTS to use it — yours.
- ✅ Distribute MRT2-derived "agent DJ instruments" as paid NFT downloads — yours.

The **same** clause shifts copyright-infringement risk to **you** (and your users). If your model generates something that sounds substantially similar to a copyrighted work, Google is not your lawyer. You are. This is normal for any AI tool and is solved by the OAC `Compliance` agent already in your architecture (C2PA provenance, fraud score, copyright-similarity check before mint).

---

## ⟁ THE ATTRIBUTION REQUIREMENT

CC-BY 4.0 has **one** obligation: attribute the original creator. To stay compliant:

### What you must do

Display a credit notice **anywhere a reasonable user can find it** when using MRT2 weights. A footer is sufficient. Suggested text:

> *"Music generation powered by Magenta RealTime 2 by Google DeepMind, used under CC-BY 4.0."*

Or for tight space (e.g. mobile UI):

> *"Powered by Magenta RT · CC-BY 4.0"*

### Where to display it

- Lyria Engine UI footer (when MRT2 is the active model)
- Agent DJ Instrument NFT metadata (in the `attribution` field)
- 33-3fm-economics.html (under "credits" or in the Lyria pricing card)
- Broadcast metadata for tracks where MRT2 is the generator (`comment` field in ID3 tag)
- Anywhere you publicly market MRT2-derived products

### What you don't need to do

- Pay royalties (none required)
- Notify Google (none required)
- Use Google branding prominently (just credit them in fine print)
- Open-source your derivative work (no copyleft — your wrappers stay proprietary)
- Share fine-tunes back (no share-alike)

CC-BY is the **most permissive** of the Creative Commons licenses that requires attribution. It is functionally equivalent to MIT for commercial purposes.

---

## ⟁ APACHE 2.0 — WHAT IT ADDS

The codebase (Python library, Docker image, demos) is Apache 2.0. Three additional things it gives you beyond CC-BY:

1. **Explicit patent grant.** Google grants you a license to any patents it holds that read on the code. This matters because some music ML techniques are patented; Apache 2.0 immunizes you.
2. **No defensive-termination trap.** Some "permissive" licenses revoke your rights if you sue Google for IP infringement. Apache 2.0 has only a narrow defensive-termination clause that fires if you sue *over the Apache-licensed work specifically* — you can sue Google for anything else.
3. **State changes if modified.** If you fork and modify the code, you must note that the code was changed. Trivial NOTICE file requirement.

---

## ⟁ COMPARISON TO OTHER OPEN-WEIGHT MUSIC MODELS

| Model | Code License | Weights License | Commercial OK? | Notes |
|---|---|---|---|---|
| **MRT2 (Magenta RT)** | Apache 2.0 | CC-BY 4.0 | **Yes, full** | Cleanest commercial posture. |
| **MusicGen** (Meta) | MIT | CC-BY-NC 4.0 | **No** | Non-commercial weights. Killshot for any paid product. |
| **AudioCraft** (Meta) | MIT | Mixed CC-BY-NC | **No** | Same NC trap. |
| **Stable Audio Open** (Stability AI) | Stability AI license | Stability AI license | **Yes, with cap** | Free for under $1M annual revenue, license fee above. |
| **Suno** (closed) | Closed | Closed (proprietary) | **API only** | Pay per generation; outputs allowed in mints per their TOS but model is not yours to run. |
| **Udio** (closed) | Closed | Closed (proprietary) | **API only** | Similar to Suno. |

**MRT2 is the only major real-time music model with a fully commercial-permissive license on both code and weights.** This is genuinely unusual. Meta's models are NC; Stability has a revenue gate; closed models are API-rented.

---

## ⟁ ONE OPEN QUESTION (FLAG, NOT BLOCKER)

The **standalone Mac apps** (Jam, Collider, MRT2 Plugin) downloaded from `magenta.withgoogle.com/mrt2` may bundle additional code beyond the GitHub repo. The page does not link to a separate EULA, but **before redistributing the Mac apps themselves** as part of a commercial bundle, check inside the downloaded ZIPs for any LICENSE file specific to the app builds.

For **using** the apps (downloading, running, generating outputs) the license is the same as the GitHub repo. The question only matters if you want to **redistribute** the Mac apps inside your own bundle.

**Recommendation:** don't redistribute the Mac apps. Link users to download them directly from Magenta's CDN. Side-steps the question entirely.

---

## ⟁ ACTION ITEMS

- [ ] Add attribution footer to Lyria Engine UI when MRT2 model is active
- [ ] Add `attribution` field to Agent DJ Instrument NFT metadata schema
- [ ] Add "Powered by Magenta RT · CC-BY 4.0" credit to 33-3fm-economics.html Lyria pricing card
- [ ] Include MRT2 credit in ID3 comment tag for broadcast tracks generated with MRT2
- [ ] Document attribution requirement in OAC `Compliance` agent's checklist
- [ ] Link to MRT2 download from Lyria Engine (not bundle the Mac apps)

That's the entire compliance footprint. **Negligible cost, fully unblocks every play.**

`// END LICENSE ANALYSIS //`
`// FULL GREEN LIGHT · BUILD AT WILL //`
