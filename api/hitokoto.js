const path = require('path');
const fs = require('fs');
const { checkDomain, readLines, CONFIG_DIR } = require('./_utils');

module.exports = function handler(req, res) {
  if (!checkDomain(req, res)) return;

  const { c = 'default', format = 'text' } = req.query;
  
  // Security: Sanitize category
  const safeCategory = c.replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(CONFIG_DIR, 'hitokoto', `${safeCategory}.txt`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Category not found');
  }

  const lines = readLines(filePath);
  if (lines.length === 0) {
    return res.status(404).send('No content in category');
  }

  const randomLine = lines[Math.floor(Math.random() * lines.length)];

  res.setHeader('Cache-Control', 'no-store');

  if (format === 'json') {
    res.status(200).json({
      hitokoto: randomLine,
      category: safeCategory
    });
  } else {
    res.status(200).send(randomLine);
  }
}
