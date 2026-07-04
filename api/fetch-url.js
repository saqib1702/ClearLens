export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = (req.query.url || '').toString();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: 'A valid http(s) url is required' });
  }

  // Basic SSRF guard: block obvious internal/loopback hosts
  try {
    const u = new URL(target);
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return res.status(400).json({ error: 'Blocked host' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid url' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const origin = new URL(target).origin;
    const response = await fetch(target, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Mimic a real desktop browser to avoid naive bot blocks
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': origin + '/',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream returned ' + response.status });
    }

    const ctype = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ctype)) {
      return res.status(415).json({ error: 'Unsupported content type' });
    }

    let html = await response.text();
    // Cap payload to keep response small
    if (html.length > 800000) html = html.slice(0, 800000);

    return res.status(200).json({ html });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Fetch timed out' });
    }
    return res.status(502).json({ error: 'Fetch failed' });
  }
}
