import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import geoip from 'geoip-lite';
import cors from 'cors';

// --- Configuration & Helpers ---

const CONFIG_DIR = path.join(process.cwd(), 'config');

// Cache for file contents to avoid disk I/O on every request
const fileCache: Record<string, { mtime: number, lines: string[] }> = {};
const CACHE_TTL_MS = 60000; // Cache TTL: 1 minute (adjust as needed)

// Helper to read lines from a text file with caching
const readLines = (filePath: string): string[] => {
  try {
    if (!fs.existsSync(filePath)) return [];

    const stats = fs.statSync(filePath);
    const mtime = stats.mtimeMs;

    // Check cache
    if (fileCache[filePath] && fileCache[filePath].mtime === mtime) {
      return fileCache[filePath].lines;
    }

    // Read file and update cache
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    fileCache[filePath] = { mtime, lines };
    return lines;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
};

// Helper to get allowed domains (cached via readLines)
const getAllowedDomains = (): string[] => {
  return readLines(path.join(CONFIG_DIR, 'domain.txt'));
};

// Middleware to check domain/referer
const domainCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedDomains = getAllowedDomains();
  
  if (allowedDomains.length === 0) {
    return next();
  }

  const referer = req.headers.referer || req.headers.origin;
  
  if (!referer) {
    return next();
  }

  try {
    const refererUrl = new URL(referer);
    const hostname = refererUrl.hostname;
    
    // Optimized domain check using Set for O(1) lookup if exact match, 
    // but we need suffix match for subdomains.
    // Since the list is likely small, .some() is fine, but let's optimize slightly.
    const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    
    if (isAllowed) {
      return next();
    }
  } catch (e) {
    // Invalid URL
  }

  res.status(403).json({ error: 'Forbidden: Domain not allowed' });
};

// --- API Implementation ---

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors()); // Basic CORS
  app.use(express.json());
  
  // Enable compression/gzip if needed, but for simple text APIs it might be overkill.
  // However, removing 'x-powered-by' saves a few bytes and improves security slightly.
  app.disable('x-powered-by');

  // 1. Visitor API
  app.get('/api/visitor', domainCheckMiddleware, (req, res) => {
    // Get IP
    let ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    // Handle IPv6 localhost
    if (ip === '::1') ip = '127.0.0.1';

    // geoip.lookup is synchronous and fast (memory lookup)
    const geo = geoip.lookup(ip);

    const response = {
      ip: ip,
      country: geo?.country || 'Unknown',
      region: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
      ll: geo?.ll || [0, 0], // Latitude, Longitude
      timezone: geo?.timezone || 'UTC'
    };

    // Set Cache-Control header for client-side caching (e.g., 60 seconds)
    // Visitor info doesn't change often for the same session.
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(response);
  });

  // 2. Hitokoto (One Word) API
  app.get('/api/hitokoto', domainCheckMiddleware, (req, res) => {
    const category = (req.query.c as string) || 'default';
    const format = (req.query.format as string) || 'text';

    // Sanitize category to prevent directory traversal
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(CONFIG_DIR, 'hitokoto', `${safeCategory}.txt`);
    
    // Check file existence (cached check effectively via readLines logic, but we need to handle 404)
    // We'll let readLines handle it, if empty array returned and file doesn't exist logic.
    // But readLines returns [] on error/missing.
    
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

    // No client-side cache for random quotes to ensure randomness on refresh
    res.setHeader('Cache-Control', 'no-store');

    if (format === 'json') {
      res.json({
        hitokoto: randomLine,
        category: safeCategory
      });
    } else {
      res.send(randomLine);
    }
  });

  // 3. Random Image API
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

    // No client-side cache for random images
    res.setHeader('Cache-Control', 'no-store');

    if (format === 'json') {
      res.json({
        url: randomImage,
        category: safeCategory
      });
    } else {
      res.redirect(randomImage);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback: serve index.html for any unknown routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
