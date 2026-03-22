import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Redis for share codes (optional — gracefully degrades if not configured)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages,
    });

    const textBlock = response.content.find((block: { type: string }) => block.type === 'text');
    res.json({ content: textBlock ? (textBlock as { text: string }).text : '' });
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: 'Failed to call Claude API' });
  }
});

// Save shared jobs — returns a short code
app.post('/api/share', async (req, res) => {
  if (!redis) {
    res.status(503).json({ error: 'Sharing not configured' });
    return;
  }

  try {
    const { jobs, lastReport } = req.body;
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      res.status(400).json({ error: 'No jobs to share' });
      return;
    }

    // Generate a 6-character code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Store with 7-day expiration
    const payload = { jobs, lastReport: lastReport || null };
    await redis.set(`share:${code}`, JSON.stringify(payload), { ex: 60 * 60 * 24 * 7 });

    res.json({ code });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ error: 'Failed to save shared jobs' });
  }
});

// Load shared jobs by code
app.get('/api/share/:code', async (req, res) => {
  if (!redis) {
    res.status(503).json({ error: 'Sharing not configured' });
    return;
  }

  try {
    const { code } = req.params;
    const data = await redis.get(`share:${code.toUpperCase()}`);

    if (!data) {
      res.status(404).json({ error: 'Code not found or expired' });
      return;
    }

    // data might already be parsed by @upstash/redis
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    // Support both old format (plain array) and new format ({ jobs, lastReport })
    if (Array.isArray(parsed)) {
      res.json({ jobs: parsed, lastReport: null });
    } else {
      res.json({ jobs: parsed.jobs, lastReport: parsed.lastReport || null });
    }
  } catch (error) {
    console.error('Load share error:', error);
    res.status(500).json({ error: 'Failed to load shared jobs' });
  }
});

// In production, serve the built frontend
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
