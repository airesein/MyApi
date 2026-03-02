const fs = require('fs');
const path = require('path');

// Vercel runtime: process.cwd() is the root
const CONFIG_DIR = path.join(process.cwd(), 'config');
const DOMAIN_FILE = path.join(CONFIG_DIR, 'domain.txt');

// Cache for file contents
const fileCache = {};

function readLines(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];

    const stats = fs.statSync(filePath);
    const mtime = stats.mtimeMs;

    if (fileCache[filePath] && fileCache[filePath].mtime === mtime) {
      return fileCache[filePath].lines;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    fileCache[filePath] = { mtime, lines };
    return lines;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
}

function checkDomain(req, res) {
  const allowedDomains = readLines(DOMAIN_FILE);
  
  // If config is empty, allow all (dev mode)
  if (allowedDomains.length === 0) return true;

  const referer = req.headers.referer || req.headers.origin;
  
  // If no referer, we might allow direct access or block. 
  // For API usability, usually block if strict, but let's allow for now or check logic.
  // The previous logic allowed empty referer.
  if (!referer) return true;

  try {
    const refererUrl = new URL(referer);
    const hostname = refererUrl.hostname;
    
    const isAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (isAllowed) return true;
  } catch (e) {}

  res.status(403).json({ error: 'Forbidden: Domain not allowed' });
  return false;
}

module.exports = {
  CONFIG_DIR,
  readLines,
  checkDomain
};
