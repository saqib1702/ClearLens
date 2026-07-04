export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'NewsAPI key not configured', demo: true });
  }

  try {
    const cacheBust = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=8&apiKey=${apiKey}&_t=${cacheBust}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'NewsAPI error', demo: true });
    }

    const data = await response.json();
    const articles = (data.articles || [])
      .filter(a => a.title && a.title !== '[Removed]')
      .slice(0, 8)
      .map(a => ({
        title: a.title,
        source: a.source?.name || '',
        url: a.url || '#',
        image: a.urlToImage || null
      }));

    return res.status(200).json({ data: articles });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timed out', demo: true });
    }
    return res.status(500).json({ error: 'Internal server error', demo: true });
  }
}
