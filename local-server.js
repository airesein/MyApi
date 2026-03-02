const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies (Vercel functions expect parsed body)
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Helper to adapt Express req/res to Vercel function signature if needed
// Vercel functions are (req, res) => void, which matches Express handlers mostly.
// However, we need to import the default export from the file.

const apiDir = path.join(__dirname, 'api');

// Dynamic routing for /api/*
app.all('/api/:functionName', async (req, res) => {
  const functionName = req.params.functionName;
  const modulePath = path.join(apiDir, `${functionName}.js`);

  if (fs.existsSync(modulePath)) {
    try {
      // Invalidate cache to allow hot-reloading of functions
      delete require.cache[require.resolve(modulePath)];
      const handler = require(modulePath);
      
      // Support both module.exports and export default
      const func = handler.default || handler;
      
      if (typeof func === 'function') {
        return func(req, res);
      } else {
        console.error(`Module ${functionName} does not export a function`);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } catch (err) {
      console.error(`Error executing function ${functionName}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(404).json({ error: 'Function not found' });
  }
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
});
