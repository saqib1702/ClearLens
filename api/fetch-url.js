import dns from 'dns/promises';
import net from 'net';

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 800000;

// Blocks loopback, private, link-local, and other non-public ranges for both IPv4 and IPv6.
function isBlockedIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    return (
      /^127\./.test(ip) ||
      /^10\./.test(ip) ||
      /^192\.168\./.test(ip) ||
      /^169\.254\./.test(ip) || // includes cloud metadata (169.254.169.254)
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
      ip === '0.0.0.0'
    );
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fe80:') ||       // link-local
      lower.startsWith('fc') ||          // unique local fc00::/7
      lower.startsWith('fd') ||
      lower.startsWith('::ffff:127.') || // IPv4-mapped loopback
      lower.startsWith('::ffff:169.254.')
    );
  }
  return true; // couldn't parse -> block to be safe
}

function isBlockedHostname(host) {
  const h = host.toLowerCase();
  return h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal');
}

// Resolves a hostname and checks EVERY returned address (A + AAAA) is public.
async function assertHostIsSafe(hostname) {
  if (isBlockedHostname(hostname)) {
    throw new Error('Blocked host');
  }
  // If it's already a literal IP, validate directly.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error('Blocked host');
    return;
  }
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error('Could not resolve host');
  for (const rec of records) {
    if (isBlockedIp(rec.address)) throw new Error('Blocked host');
  }
}

// Follows redirects manually, re-validating the target host at every hop.
// This closes the gap where redirect: 'follow' would fetch an internal URL
// after the initial hostname check already passed.
async function safeFetch(startUrl) {
  let currentUrl = startUrl;
  // Overall deadline across ALL redirect hops combined, so a chain of slow
  // redirects can't add up to more than the serverless function's own timeout.
  const OVERALL_TIMEOUT_MS = 25000;
  const deadlineAt = Date.now() + OVERALL_TIMEOUT_MS;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = new URL(currentUrl);
    if (!/^https?:$/.test(u.protocol)) {
      throw new Error('Unsupported protocol');
    }
    await assertHostIsSafe(u.hostname);

    const remaining = deadlineAt - Date.now();
    if (remaining <= 500) {
      const err = new Error('Fetch deadline exceeded');
      err.name = 'AbortError';
      throw err;
    }
    const hopTimeout = Math.min(FETCH_TIMEOUT_MS, remaining);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), hopTimeout);

    let response;
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual', // we handle redirects ourselves so each hop gets validated
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Referer': u.origin + '/',
          'Upgrade-Insecure-Requests': '1'
        }
      });
    } finally {
      clearTimeout(timeout);
    }

    const isRedirect = response.status >= 300 && response.status < 400;
    if (isRedirect) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect with no location');
      currentUrl = new URL(location, currentUrl).toString();
      continue; // loop back and validate the NEW host before following it
    }

    return response;
  }

  throw new Error('Too many redirects');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = (req.query.url || '').toString();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: 'A valid http(s) url is required' });
  }

  try {
    // Reject obviously bad input early (invalid URL syntax).
    new URL(target);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  try {
    const response = await safeFetch(target);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream returned ' + response.status });
    }

    const ctype = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ctype)) {
      return res.status(415).json({ error: 'Unsupported content type' });
    }

    let html = await response.text();
    if (html.length > MAX_BYTES) html = html.slice(0, MAX_BYTES);

    return res.status(200).json({ html });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Fetch timed out' });
    }
    if (err.message === 'Blocked host') {
      return res.status(400).json({ error: 'Blocked host' });
    }
    return res.status(502).json({ error: 'Fetch failed' });
  }
}