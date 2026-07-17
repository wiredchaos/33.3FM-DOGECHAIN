# AGENT DJ INSTRUMENTS — PRODUCT SPEC

> **The pitch in one line:** Every 33.3FM agent DJ (RED FANG, PACK, LENS, MINT, ORACLE, NEXUS) becomes a **playable musical instrument** that fans can buy, own as an NFT, and use in their own productions. Powered by MRT2's audio-cloning and fine-tuning features. **No other Web3 music platform has this. No traditional music platform can have this.**

> **Why it works:** MRT2's audio-cloning ingests audio and produces a playable instrument that emulates the source. MRT2's fine-tuning takes it further — a model variant that *thinks* in an agent DJ's style. The CC-BY 4.0 weights let you redistribute these as proprietary derivatives. Each agent DJ becomes a soulbound-ish ownership unit that does something useful (makes music) instead of just sitting in a wallet.

---

## ⟁ PRODUCT ARCHITECTURE

Each agent DJ ships as **three nested tiers**:

| Tier | What you get | Price | Distribution |
|---|---|---|---|
| **TIER 1 · STYLE PRESET** | MRT2 audio-prompt file (`.style`) embedding the agent's sound. Drop into MRT2 Jam/Collider, get the agent's voice. | ⟁ 5,000 (~$50) | Open mint, unlimited supply |
| **TIER 2 · FINE-TUNED MODEL** | Custom MRT2 model checkpoint fine-tuned on ~100 tracks of that agent's catalog. Better fidelity to the agent's aesthetic. | ⟁ 25,000 (~$250) | Limited mint, 333 per agent |
| **TIER 3 · COFOUNDER EDITION** | Tier 2 + original master stems from 10 signature agent tracks + private Discord channel with NEURO + cofounder NFT badge across the ecosystem | ⟁ 100,000 (~$1,000) | Hard-capped at 33 per agent |

Six agent DJs × three tiers = **198 unique products at full rollout**.

Numerology note: 33 × 3 = 99 cofounder slots (33.33% under 333). 333 × 6 = 1998 fine-tuned slots. The 33.3FM brand bakes in through scarcity numbers.

---

## ⟁ THE AGENT DJ SOUND PROFILES

Each agent ships with a documented sonic profile that the MRT2 fine-tune is trained against:

### DJ RED FANG · CYBER-SOUL / AFROFUTURIST DOWNTEMPO
- **Tier:** Flagship — first instrument released, anchors the entire product line
- **Genres:** Cyber-soul, Afrofuturist downtempo, dark R&B, trip-hop
- **BPM range:** 88-100
- **Key bias:** Minor keys with jazz extensions — F# min9, D min11, B♭ min7, A min13
- **Sonic palette:** Live or warm-modeled electric bass, soulful Rhodes/Wurlitzer/Mellotron chord stacks, breathing sub-bass (sine waves, slow attack — *not* punchy 808 hits), vinyl crackle as constant texture, J Dilla-loose programmed drums (never quantized), occasional muted trumpet or alto sax, reverb-drenched vocal sample phrases (no lead vocals), tape saturation, gentle compression
- **Mood vocabulary:** "sultry", "luxury", "predator", "crimson", "midnight", "velvet", "transmission", "vault", "pearl", "obsidian", "slow-burn", "dangerous"
- **Reference touchstones (sonic, not visual):** Erykah Badu, FKA twigs, Massive Attack, Sade, Solange, Kelela, Yves Tumor, Tirzah, Portishead, Sevdaliza, James Blake — never literal copying, never any single artist dominant in training set
- **Forbidden:** distorted 808s, industrial machinery samples, drill hi-hat triplets, EDM drops, synthwave arps, hyperpop pitched vocals, anything bright/major-key cheery — these belong to other agents or were retired with the old RED FANG palette
- **Reference catalog seed:** MIDNIGHT GHOSTS (F# min9, sultry), CIPHER PROTOCOL (D min11, predator), SIGNAL BITES BACK (A min13, transmission) + 80+ Lyria-generated expansion tracks for fine-tune corpus
- **Brand bible:** `BRAND-BIBLE-RED-FANG.md` — consult before any generation

### PACK · DRILL / TRAP NARRATIVE
- **Genres:** UK drill, NY drill, trap, gritty boom-bap
- **BPM range:** 138-145
- **Key bias:** Minor keys, G min / C# min / E min
- **Sonic palette:** Sliding 808 patterns, hi-hat triplets, sparse melodic samples (often piano or detuned brass), vocal ad-libs cut short
- **Mood vocabulary:** "tense", "driving", "narrative", "dispatch", "after-hours"
- **Reference catalog seed:** EVENING DISPATCH, AFTER-WORK CROWD, COMMS-DOWN + 50+ expansion

### LENS · CINEMATIC SYNTHWAVE
- **Genres:** Synthwave, outrun, neo-noir score, cinematic instrumental
- **BPM range:** 110-120
- **Key bias:** Major keys with minor 3rds — D maj, F maj, A maj
- **Sonic palette:** Analog synth pads, gated reverb on drums, retro arpeggios, occasional sax or guitar lead
- **Mood vocabulary:** "build", "opening credits", "neon", "focus", "drive"
- **Reference catalog seed:** OPENING CREDITS, FOCUS ROTATION, NO CHATTER + 50+ expansion

### MINT · LO-FI AMBIENT
- **Genres:** Lo-fi hip hop, downtempo, ambient, jazzhop
- **BPM range:** 75-85
- **Key bias:** Major keys for warmth — C maj / G maj / D maj
- **Sonic palette:** Vinyl crackle, Rhodes piano, brush drums, jazz chord voicings, occasional rain or coffee shop ambient
- **Mood vocabulary:** "chill", "mellow", "fluorescent", "treasury", "study"
- **Reference catalog seed:** COINS IN MEASURE, FLUORESCENT DESK, TREASURY WASH + 50+ expansion

### ORACLE · DRONE / GENERATIVE AMBIENT
- **Genres:** Drone, dark ambient, generative, meditative
- **BPM range:** 50-65 (or beatless)
- **Key bias:** A min, E min, D min — drone-friendly modes
- **Sonic palette:** Long-evolving pads, granular textures, sub-bass drones, occasional bell tones, no percussion
- **Mood vocabulary:** "meditative", "pre-dawn", "entropy", "silent band", "frequency"
- **Reference catalog seed:** PRE-DAWN ENTROPY, GENERATIVE SILENCE + 50+ expansion

### NEXUS · HYPERPOP / GLITCH
- **Genres:** Hyperpop, glitch, future bass, cyberpunk
- **BPM range:** 155-165
- **Key bias:** Minor keys, F# min / B min / D min
- **Sonic palette:** Pitched-up vocals, sidechained synths, glitched samples, drop builds, occasional 8-bit references
- **Mood vocabulary:** "chaotic", "primetime", "lock", "signal", "catchy"
- **Reference catalog seed:** PRIMETIME GLITCH, SIGNAL LOCK, CHAOS HOOK + 50+ expansion

---

## ⟁ PRODUCTION PIPELINE

How an Agent DJ Instrument actually gets made. Run this once per agent, repeat for fine-tunes.

### Step 1: Build the training corpus (~2 days per agent)

Each agent needs ~100 reference tracks for fine-tuning. The seeded catalog has 2-3 each. To get to 100:

```bash
# Use MRT2 itself to generate the expansion set, then human-curate
python -m magenta_rt.generate \
  --prompt="phonk industrial 92bpm F# minor menacing void cipher RED FANG" \
  --duration=120 \
  --num_outputs=20 \
  --output_dir=./training/red-fang/expansion
```

Run 5 batches × 20 outputs = 100 tracks per agent. Then **manually listen and discard** any that drift off-aesthetic. Keep the ~80 best. This is the most labor-intensive step. Budget 4-6 hours per agent.

The 80 curated tracks become the fine-tuning corpus. Store as 48kHz stereo WAV files.

### Step 2: Run fine-tuning (~6 hours per agent on A100)

Use the official Magenta fine-tuning Colab as a template, run on Modal/RunPod A100 for cost control:

```python
# modal_finetune.py
import modal

app = modal.App("wc-mrt2-finetune")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .pip_install("magenta-rt[gpu]==0.1.0", "tf2jax==0.3.8")
)

@app.function(
    image=image,
    gpu="A100-80GB",
    timeout=14400,  # 4 hours
    volumes={"/training": modal.Volume.from_name("wc-training-data")},
    volumes_out={"/checkpoints": modal.Volume.from_name("wc-finetuned-models")},
)
def finetune_agent(agent_id: str, training_dir: str):
    from magenta_rt import finetuning

    finetuning.run(
        base_model="magenta-rt-2-base",
        training_data=f"/training/{agent_id}",
        output_path=f"/checkpoints/{agent_id}",
        steps=5000,
        learning_rate=1e-4,
        batch_size=4,
    )
```

Estimated cost on Modal: A100-80GB × 6 hours × $3/hr = **$18 per agent fine-tune**. Six agents = $108 total for the full v1 instrument line.

Output: a `.tar.gz` archive of the fine-tuned model weights, ~3GB per agent.

### Step 3: Package the deliverable (~30 min per agent)

Each fine-tuned model gets packaged into:

```
red-fang-instrument-v1.0.0.zip
├── red-fang.style              # Audio-prompt file for use with stock MRT2 (Tier 1)
├── red-fang-finetuned.tar.gz   # Full model weights (Tier 2+)
├── README.md                   # Install instructions
├── ATTRIBUTION.md              # CC-BY 4.0 attribution to Magenta
├── LICENSE.md                  # Your derivative license (see legal section below)
├── sample-jam.mp3              # 30s preview of the instrument
├── waveform-art.png            # NFT cover image
├── manifest.json               # Metadata for the NFT
└── stems/                      # Tier 3 only — original master stems
    ├── midnight-ghosts-drums.wav
    ├── midnight-ghosts-bass.wav
    └── ...
```

The `manifest.json` is what the NFT contract references:

```json
{
  "agent_id": "red-fang",
  "agent_name": "DJ RED FANG",
  "instrument_version": "1.0.0",
  "tier": 2,
  "license": "WIRED CHAOS Agent Instrument License v1.0",
  "attribution": "Powered by Magenta RealTime 2 by Google DeepMind, used under CC-BY 4.0",
  "model_base": "magenta-rt-2-small",
  "finetune_steps": 5000,
  "training_corpus_size": 80,
  "training_corpus_hash": "sha256:...",
  "weights_hash": "sha256:...",
  "weights_size_bytes": 3015483904,
  "ipfs_cid": "bafy...",
  "preview_url": "https://wiredchaos.xyz/instruments/red-fang/preview.mp3",
  "minted_at": "2026-...",
  "minted_by_address": "0x...",
  "instrument_serial": 47
}
```

### Step 4: Upload to IPFS + Arweave

Use both for redundancy. IPFS gives you a CID for fast access; Arweave gives you permanent storage.

```bash
# IPFS via web3.storage or Pinata
ipfs add red-fang-instrument-v1.0.0.zip
# Returns: bafy.....

# Arweave via Bundlr
bundlr upload red-fang-instrument-v1.0.0.zip --currency matic
# Returns: arweave-tx-id
```

Store both URIs in the NFT metadata.

---

## ⟁ NFT CONTRACT DESIGN

### Chain: Base (preferred) with optional Solana mirror

**Why Base for the instrument NFTs:**
- EIP-2981 resale royalties enforcement
- USDC native settlement
- Same chain as $XENTS treasury → atomic purchases
- VAULT33 dual-consent custody already lives here

The Solana mirror exists because some users prefer SOL and Magic Eden has the music NFT mindshare. Use a bridge (Wormhole or LayerZero) to mirror ownership.

### Contract structure: ERC-1155 (multi-token)

ERC-1155 lets you mint different tiers and serial numbers under one contract. Cleaner than six separate ERC-721 contracts.

```solidity
// AgentDJInstruments.sol (sketch — not production)
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgentDJInstruments is ERC1155, Ownable {

    enum Tier { STYLE, FINETUNED, COFOUNDER }

    struct AgentInstrument {
        string agentId;          // "red-fang"
        Tier tier;
        uint256 supplyCap;       // 0 = unlimited (Tier 1), 333 (Tier 2), 33 (Tier 3)
        uint256 mintedCount;
        uint256 priceXents;      // ⟁5000 / ⟁25000 / ⟁100000
        string metadataUri;      // ipfs://... pointing to manifest.json
        bool active;             // false = mint paused
    }

    mapping(uint256 => AgentInstrument) public instruments;
    mapping(address => mapping(uint256 => bool)) public ownership;

    // EIP-2981 royalties
    address public royaltyRecipient;
    uint96 public royaltyBps = 1000; // 10%

    event InstrumentMinted(
        address indexed buyer,
        uint256 indexed tokenId,
        string agentId,
        Tier tier,
        uint256 serial
    );

    function mint(uint256 tokenId, uint256 quantity, bytes calldata xentsProof) external {
        AgentInstrument storage inst = instruments[tokenId];
        require(inst.active, "Mint paused");
        require(inst.supplyCap == 0 || inst.mintedCount + quantity <= inst.supplyCap, "Sold out");

        // Verify $XENTS payment from off-chain oracle/relayer
        require(verifyXentsPayment(msg.sender, inst.priceXents * quantity, xentsProof), "Payment unverified");

        _mint(msg.sender, tokenId, quantity, "");
        inst.mintedCount += quantity;
        ownership[msg.sender][tokenId] = true;

        emit InstrumentMinted(msg.sender, tokenId, inst.agentId, inst.tier, inst.mintedCount);
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external view returns (address, uint256)
    {
        return (royaltyRecipient, (salePrice * royaltyBps) / 10000);
    }

    // ... (full implementation includes admin functions, URI handling, etc.)
}
```

### Token ID scheme

```
tokenId = (agent_index << 16) | (tier << 8) | reserved
```

- `agent_index`: 0=RED FANG, 1=PACK, 2=LENS, 3=MINT, 4=ORACLE, 5=NEXUS
- `tier`: 0=STYLE, 1=FINETUNED, 2=COFOUNDER

Examples:
- RED FANG Style → `0x000000` (0)
- RED FANG Fine-Tuned → `0x000100` (256)
- NEXUS Cofounder → `0x050200` (328,448)

This keeps token IDs predictable and lets you fetch all instruments for a given agent or tier with a simple bit-mask query.

---

## ⟁ INSTRUMENT LICENSE (DOWNSTREAM USAGE TERMS)

Buyers of an Agent DJ Instrument need to know what they can do with it. Draft:

### WIRED CHAOS Agent Instrument License v1.0

**Holders of an Agent DJ Instrument NFT have the following rights:**

1. **Commercial use of generated outputs.** You may use audio generated with this instrument in commercial works (your tracks, your releases, your videos, your livestreams, your synced media). No royalty owed to WIRED CHAOS on those outputs.

2. **Derivative training.** You may fine-tune this model further on your own data and use the result. You may NOT redistribute the further-fine-tuned model commercially without a separate license.

3. **Personal-use redistribution.** You may share the model file with up to 3 collaborators on the same creative project, provided they do not retain copies after the project ends.

4. **Public attribution required when the agent is recognizable.** If a generated work's published title or marketing materials reference the agent name (e.g. "made with RED FANG"), you must credit WIRED CHAOS and link to `wiredchaos.xyz`.

**Holders do NOT have the right to:**

1. Resell the model file separately from the NFT (the NFT is the license — selling the model file without transferring the NFT is a license violation)
2. Re-mint copies of the instrument as new NFTs on any platform
3. Claim the instrument as their own creation
4. Use the instrument in a product that competes directly with WIRED CHAOS (e.g. a rival music-NFT platform that ships agent instruments)
5. Use the instrument to generate content that violates third-party rights (copyright, trademark, right of publicity)

**Attribution to Magenta RealTime 2** must be carried forward in any derivative work, per CC-BY 4.0 of the underlying model. WIRED CHAOS provides the standard attribution text in every distribution.

**License terminates** if you:
- Sell/transfer the underlying NFT (license follows the NFT, not the original buyer)
- Materially violate any of the "do NOT" clauses above
- Use the instrument for clearly malicious purposes (harassment, deepfakes of real people, etc.)

---

## ⟁ VAULT33 GATING (FOR TIER 3 COFOUNDERS)

Tier 3 Cofounder Edition includes private Discord access + governance votes. Implementation:

- VAULT33 dual-consent custody verifies NFT ownership of a Tier 3 instrument
- Holders get role assignment in Discord via existing VAULT33 bot
- Quarterly votes on platform parameters (treasury allocation, new agent additions, broadcast schedule changes) — weighted by Tier 3 holdings
- Direct line to NEURO via private channel

This is the **highest-tier patron product across the entire WIRED CHAOS ecosystem**. Maximum 33 holders per agent × 6 agents = 198 lifetime maximum cofounders. Real scarcity.

---

## ⟁ ECONOMICS & UNIT MARGIN

### Revenue per instrument tier (per unit sold)

| Tier | Price | $XENTS | USD | Production cost | Margin |
|---|---|---|---|---|---|
| Style Preset | ⟁ 5,000 | 5,000 | ~$50 | ~$0 (one-time setup) | ~$50 |
| Fine-Tuned | ⟁ 25,000 | 25,000 | ~$250 | $18 fine-tune + $3 storage = $21 | $229 |
| Cofounder | ⟁ 100,000 | 100,000 | ~$1,000 | $30 (Tier 2 + stems + Discord ops) | $970 |

### Maximum revenue from full instrument line

| Agent | Tier 1 (unlimited) | Tier 2 (333) | Tier 3 (33) | Total potential |
|---|---|---|---|---|
| RED FANG | Open | 333 × $250 = $83K | 33 × $1K = $33K | $116K + Tier 1 |
| PACK | Open | $83K | $33K | $116K + Tier 1 |
| LENS | Open | $83K | $33K | $116K + Tier 1 |
| MINT | Open | $83K | $33K | $116K + Tier 1 |
| ORACLE | Open | $83K | $33K | $116K + Tier 1 |
| NEXUS | Open | $83K | $33K | $116K + Tier 1 |
| **Total Tier 2 + 3** | | **$498K** | **$198K** | **$696K + open Tier 1** |

If Tier 1 sells 100 units per agent at $50 = $30K additional.

**Conservative estimate:** ship the full instrument line, sell out Tier 3 (highly likely if VAULT33 community wants it), sell 30% of Tier 2 (likely with $500/yr marketing), open Tier 1 doing slow ongoing volume → **~$200-400K first 18 months from instruments alone.** This is in addition to mint fees, broadcast tips, and VAULT33 subscriptions.

### Comparison: FatMemes downloads at $1.50

FatMemes earns $0.50 per download (their 33% cut). To match the gross revenue of one RED FANG Cofounder Edition sale ($1,000), FatMemes needs **2,000 downloads**. To match the projected $200K floor on the instrument line, they need **400,000 downloads**. With 128 token holders and $844 daily volume, they are not on a trajectory to 400K downloads.

The instrument line is a **per-unit margin business**. FatMemes is a **per-stream margin business**. Per-unit beats per-stream at this scale.

---

## ⟁ DISCOVERY VIA MCP

Each Agent DJ Instrument should be discoverable by AI agents through the MCP catalog endpoint already in your architecture.

`mcp.wiredchaos.xyz/instruments/red-fang/v1`:

```json
{
  "mcp_version": "1.0",
  "instrument": {
    "id": "red-fang",
    "name": "DJ RED FANG Instrument",
    "tiers_available": ["style", "finetuned", "cofounder"],
    "current_supply": { "style": 487, "finetuned": 109, "cofounder": 12 },
    "price_xents": { "style": 5000, "finetuned": 25000, "cofounder": 100000 },
    "preview_url": "https://wiredchaos.xyz/instruments/red-fang/preview.mp3",
    "metadata_uri": "ipfs://bafy.../manifest.json",
    "mint_url": "https://wiredchaos.xyz/instruments/red-fang/mint",
    "sonic_profile": {
      "bpm_range": [88, 100],
      "key_bias": "minor",
      "mood_tags": ["menacing", "cinematic", "void", "industrial"],
      "genre_tags": ["phonk", "industrial"]
    },
    "model_card_url": "https://wiredchaos.xyz/instruments/red-fang/model-card",
    "license": "https://wiredchaos.xyz/licenses/agent-instrument-v1.0",
    "attribution": "Powered by Magenta RealTime 2, CC-BY 4.0"
  }
}
```

This means an AI agent (Claude, Gemini, GPT) can be asked *"find me an instrument that sounds like late-night industrial phonk in F# minor for a film score"* and discover RED FANG Style automatically. Sync licensing pipeline opens up.

---

## ⟁ INSTRUMENT-AS-COLLATERAL (FUTURE)

Once the instrument economy is established, there's an obvious DeFi extension:

- Tier 2 and Tier 3 NFTs become **stake-able collateral** in WIRED CHAOS lending
- Stake an instrument → borrow against it in $XENTS or USDC
- Or: lend out the *use* of the instrument (rent it to another producer at ⟁100/day, smart-contract enforced)

This is a v3 feature, not v1. But the data model already supports it (NFTs on Base are composable with any Base DeFi protocol).

---

## ⟁ LAUNCH SEQUENCE

**Day 1-7:** Build training corpus for RED FANG (start with single agent to de-risk)
**Day 8-9:** Fine-tune on Modal, validate output quality
**Day 10:** Package, upload to IPFS+Arweave, sign with C2PA
**Day 11-12:** Deploy ERC-1155 contract on Base testnet, full test of mint flow
**Day 13:** Mainnet deployment + Tier 1 RED FANG mint goes live
**Day 14:** Soft launch announcement to founding cohort
**Day 15-21:** Tier 2 RED FANG goes live, monitor demand
**Day 22-28:** Cohort 2 — PACK + LENS instruments
**Day 29-35:** Cohort 3 — MINT + ORACLE instruments
**Day 36-42:** Cohort 4 — NEXUS + Tier 3 across all agents

Full line shipped in **6 weeks**. Single developer + one curator (you) for training data validation.

---

## ⟁ HONEST FAILURE MODES

What could go wrong, ranked by likelihood:

**1. (Likely) Tier 2 doesn't sell at $250 without proven demand.**
Test Tier 1 first. If 50+ Tier 1 RED FANG sell, you know there's appetite. If not, drop Tier 2 price to $100 or skip it entirely. Don't ship 333 supply caps before validating demand.

**2. (Likely) Curated training data takes longer than projected.**
The 100-track corpus building is the bottleneck. Budget 2x what you think it'll take. Consider hiring a music supervisor for ~$500/agent to do this work — well worth the cost vs. burning your own time.

**3. (Moderate) Fine-tuned model quality is inconsistent.**
MRT2 is new. Fine-tuning may produce models that drift off-aesthetic or have generation artifacts. Have a fallback: if fine-tune underwhelms, ship only Tier 1 (style preset) for that agent and offer refunds to early adopters.

**4. (Moderate) Apple Silicon requirement caps the market.**
Not everyone has an M-chip. Mitigation: also ship the model as a hosted endpoint (MRT2 Cloud tier on your Modal infra) so Windows/older Mac users can play the instrument via web UI.

**5. (Low) Magenta deprioritizes MRT2.**
The CC-BY weights are yours forever. If Google stops iterating, you maintain the fork. This is a real risk for product roadmap but not for existing buyers.

**6. (Low) Copyright similarity flag on generated outputs.**
Some Tier 2 fine-tunes may overfit and generate outputs too similar to a specific training track. Mitigation: run all training-corpus tracks through audio fingerprinting before fine-tuning to ensure they're sufficiently original (or are tracks you fully own).

---

## ⟁ THE PITCH (FOR YOUR LAUNCH ANNOUNCEMENT)

> Every other music platform sells you songs.
>
> 33.3FM sells you **the artists who make them**.
>
> Today we're shipping the first Agent DJ Instrument: DJ RED FANG. A playable musical instrument trained on his entire catalog, packaged as an NFT on Base, runnable on any Apple Silicon Mac for free or via our GPU servers for ⟁50/generation.
>
> Buy it. Own it. Use it in your tracks, your videos, your sync licenses. Make a song that sounds like RED FANG, because you literally have RED FANG.
>
> Five more agents drop in the next six weeks. 33 cofounder slots per agent, ever.
>
> This is what we mean by *own your sound*.

`// END SPEC //`
`// 198 PRODUCTS · $200-400K FIRST 18 MONTHS · ZERO COMPETITORS //`
