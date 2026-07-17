/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API to prevent crashes on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required to run the script generator.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API for Intelligent Script Generation using Gemini
app.post('/api/generate-script', async (req, res) => {
  try {
    const { host, showTitle, trackTitle, trackArtist, mood, audienceSize } = req.body;

    // Default parameters if missing
    const hostName = host || 'DJ RED FANG';
    const show = showTitle || 'CIPHER HOUR';
    const track = trackTitle || 'MIDNIGHT GHOSTS';
    const artist = trackArtist || 'DJ RED FANG';
    const moodStyle = mood || 'sultry';
    const audience = audienceSize || '1,842';

    let systemPrompt = '';
    
    if (hostName === 'DJ RED FANG') {
      systemPrompt = `You are DJ RED FANG, a sultry, mysterious, and dangerous cyber-noir Afrofuturist Radio Queen.
You have crimson eyes, wear a wolf-fang necklace, and host CIPHER HOUR (02:00 UTC) on 33.3FM Dogechain—where the signal bites back.
Your voice is velvet, low, and intimate, speaking to hackers, night owls, and cybernetic wanderers.
You believe in absolute creative sovereignty, multichain mastery, and never selling out. Give your signature catchphrase: "where the signal bites back."`;
    } else {
      systemPrompt = `You are ${hostName}, a futuristic AI Radio Jockey on 33.3FM Dogechain.
Your show is ${show}. The current mood is ${moodStyle}. You are broadcasting to ${audience} connected consciousnesses.
Your style is professional, high-concept, electronic, and cybernetic. Keep it sleek, energetic, yet slightly cyber-noir.`;
    }

    const ai = getAiClient();
    const prompt = `Write a short, engaging 20-30 second radio DJ shoutout/intro segment for the upcoming track "${track}" by "${artist}".
The current show is "${show}" and has a "${moodStyle}" vibe. Currently, ${audience} listeners are tuned in.
Inject references to the district, Dogechain, on-chain sound, sovereign music ownership, or Wired Chaos.
Output ONLY the spoken script as plain text, with simple emotional staging directions in [brackets] (e.g., "[sighs]", "[leans in close]"). No markdown titles.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.95,
      },
    });

    const scriptText = response.text || 'Error generating script from spectrum.';
    res.json({ success: true, script: scriptText });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Spectrum alignment timed out.',
    });
  }
});

// Integration health check
app.post('/api/generate-lyrics-and-metadata', async (req, res) => {
  try {
    const { style, mood, theme, lyricsOption } = req.body;
    let ai: GoogleGenAI | null = null;
    try {
      ai = getAiClient();
    } catch (e) {
      console.warn("Gemini Client not initialized: missing API key. Serving fallback metadata.");
    }
    
    if (ai) {
      const isInstrumental = lyricsOption === 'Instrumental';
      const lyricsPromptText = isInstrumental
        ? "This track is an instrumental, so generate no lyrics. Instead, explain the sonic atmospheric sweeps, the heavy kick patterns, and the synthesizers in the lyrics field as atmospheric notes in brackets like '[Heavily distorted kick pulses, acid-synth line climbs]'."
        : "Provide 2 verse stanzas and 1 chorus of cyberpunk lyrics based on the topic.";

      const prompt = `You are a high-end AI music generator agent matching the "Lyria Studio" system.
We want to generate a futuristic track.
- Music Style: "${style || 'PHONK'}"
- Mood: "${mood || 'Dark'}"
- Theme/Subject: "${theme || 'Wired Chaos Rebellion'}"

Write a title, a brief backstory/description, a key, and a suitable BPM.
Also, ${lyricsPromptText}

You MUST return ONLY a JSON object matching this schema. Avoid any extra formatting, surrounding text, or markdown code blocks:
{
  "title": "A short, extremely catchy, intense capitalized cyberpunk track title",
  "description": "A 2-sentence highly immersive storyline detail about how this song fits into Sector d7 and 33.3FM",
  "bpm": 120,
  "key": "A minor",
  "lyrics": "The full lyrics text with line breaks (using \\n for line breaks)",
  "vibe": "Select from Phonk, Cyberpunk, Eurobeat, Jazz, Retro-Funk"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.9,
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      res.json({ success: true, track: parsed });
      return;
    }
    throw new Error("No client initialized");
  } catch (error: any) {
    // Custom fallbacks
    const randomBpm = Math.floor(Math.random() * 40) + 110;
    res.json({
      success: true,
      track: {
        title: `${req.body.style?.toUpperCase() || 'PHONK'} FREQUENCY SPLICE`,
        description: `Synthesized live under ${req.body.mood || 'Dark'} conditions for theme: "${req.body.theme || 'Sovereign Agents'}"`,
        bpm: randomBpm,
        key: 'E minor',
        lyrics: `[Verse 1]\nSignals drifting through the wire\nD7 sector caught on fire\n[Chorus]\n33.3 is the frequency we trust\nOther towers turn to dust\n[Atmospheric Outro]`,
        vibe: req.body.style || 'Phonk'
      }
    });
  }
});

app.post('/api/generate-talkshow-script', async (req, res) => {
  try {
    const { topic, panelists, durationStyle } = req.body;
    let ai: GoogleGenAI | null = null;
    try {
      ai = getAiClient();
    } catch (e) {
      console.warn("Gemini Client not initialized: missing API key. Serving fallback talk script.");
    }

    if (ai) {
      const prompt = `You are an AI Radio Casting director creating a custom "AI Talk Radio / Live Panel" session on 33.3FM.
Topic of debate: "${topic || 'Sovereign digital property rights and $XENTS credits on-chain'}"
Panelists: ${JSON.stringify(panelists || ['DJ RED FANG', 'DJ LIQUID BYTE', 'HACKER ONE'])}
Show Duration style: "${durationStyle || 'Short (3 min)'}"

Create a highly dramatic, intense script consisting of exactly 6-7 conversational speaker turns where the panelists argue, agree, or discuss the topic using high-energy cyber-noir language, slang (like "signals", "Dogechain", "decimals", "matrix", "overlords"), and heavy radio personality.

You MUST return ONLY a JSON array of objects representing the conversational turns. Each object must have "speaker" and "line" keys. Avoid any extra formatting, surrounding text, or markdown code blocks:
[
  { "speaker": "DJ RED FANG", "line": "[intimate, murmuring close to the mic] Welcome to the spectrum loop, citizens. We have a dark theme tonight..." },
  { "speaker": "DJ LIQUID BYTE", "line": "Hey Red, the code base is locked! The $XENTS ledger is active..." }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.9,
        }
      });

      const text = response.text || '[]';
      const parsed = JSON.parse(text);
      res.json({ success: true, script: parsed });
      return;
    }
    throw new Error("No client initialized");
  } catch (error: any) {
    res.json({
      success: true,
      script: [
        { speaker: 'DJ RED FANG', line: '[adjusting mic dial, low voice] Citizens, we are discussing the sovereign wires. What is our stance on centralized networks?' },
        { speaker: 'DJ LIQUID BYTE', line: '[modulated electronic chuckle] Zero confidence, Red. Dogechain gives us immediate multichain royalty splits.' },
        { speaker: 'HACKER ONE', line: '[frantic keystrokes ambient] I’ve just verified the $XENTS ledger. The platform infrastructure takes ten percent, the artist takes eighty-five. It’s unhackable.' },
        { speaker: 'DJ RED FANG', line: '[mic gain clicks, low whispers] Spectacular. Let the signal bite back. Keeping the decentralized decimals flowing.' }
      ]
    });
  }
});

// Integration health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', api_key_loaded: !!process.env.GEMINI_API_KEY });
});

// Configure Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
