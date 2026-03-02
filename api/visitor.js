const geoip = require('geoip-lite');
const { checkDomain } = require('./_utils');

module.exports = function handler(req, res) {
  if (!checkDomain(req, res)) return;

  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (Array.isArray(ip)) ip = ip[0];
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
  res.status(200).json(response);
}
