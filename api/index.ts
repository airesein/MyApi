import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import geoip from 'geoip-lite';
import cors from 'cors';

const app = express();

// --- Configuration & Helpers ---

// In Vercel, process.cwd() is the root of the project
const CONFIG_DIR = path.join(process.cwd(), 'config');

// Cache for file contents
const fileCache: Record<string, { mtime: number, lines: string[] }> = {};

const readLines = (filePath: string): string[] => {
  try {
    if (!fs.existsSync(filePath)) return [];

    const stats = fs.statSync(filePath);
    const mtime = stats.mtimeMs;

    if (fileCache[filePath] && fileCache[filePath].mtime === mtime) {
      return fileCache[filePath].lines;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    fileCache[filePath] = { mtime, lines };
    return lines;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
};

const getAllowedDomains = (): string[] => {
  return readLines(path.join(CONFIG_DIR, 'domain.txt'));
};

const domainCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedDomains = getAllowedDomains();
  
  if (allowedDomains.length === 0) return next();

  const referer = req.headers.referer || req.headers.origin;
  if (!referer) return next();

  try {
    const refererUrl = new URL(referer);
    const hostname = refererUrl.hostname;
    const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    if (isAllowed) return next();
  } catch (e) {}

  res.status(403).json({ error: 'Forbidden: Domain not allowed' });
};

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.disable('x-powered-by');

// --- Routes ---

app.get('/api/visitor', domainCheckMiddleware, (req, res) => {
  let ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip === '::1') ip = '127.0.0.1';

  const geo = geoip.lookup(ip);

  const response = {
    ip: ip,
    country: geo?.country || 'Unknown',
    region: geo?.region || 'Unknown',
    city: geo?.city || 'Unknown',
    ll: geo?.ll || [0, 0],
    timezone: geo?.timezone || 'UTC'
  };

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json(response);
});

app.get('/api/hitokoto', domainCheckMiddleware, (req, res) => {
  const category = (req.query.c as string) || 'default';
  const format = (req.query.format as string) || 'text';
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(CONFIG_DIR, 'hitokoto', `${safeCategory}.txt`);
  
  if (!fs.existsSync(filePath)) {
     res.status(404).send('Category not found');
     return;
  }

  const lines = readLines(filePath);
  if (lines.length === 0) {
     res.status(404).send('No content in category');
     return;
  }

  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  res.setHeader('Cache-Control', 'no-store');

  if (format === 'json') {
    res.json({ hitokoto: randomLine, category: safeCategory });
  } else {
    res.send(randomLine);
  }
});

app.get('/api/image', domainCheckMiddleware, (req, res) => {
  const category = (req.query.c as string) || 'default';
  const format = (req.query.format as string) || 'redirect';
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(CONFIG_DIR, 'image', `${safeCategory}.txt`);

  if (!fs.existsSync(filePath)) {
     res.status(404).send('Category not found');
     return;
  }

  const lines = readLines(filePath);
  if (lines.length === 0) {
     res.status(404).send('No images in category');
     return;
  }

  const randomImage = lines[Math.floor(Math.random() * lines.length)];
  res.setHeader('Cache-Control', 'no-store');

  if (format === 'json') {
    res.json({ url: randomImage, category: safeCategory });
  } else {
    res.redirect(randomImage);
  }
});

// Export the app for Vercel
export default app;
