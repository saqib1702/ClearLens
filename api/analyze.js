// Simple in-memory sliding-window rate limiter.
// NOTE: resets on cold start and isn't shared across serverless instances/regions.
// Good enough to stop casual abuse; upgrade to Upstash Redis if this app gets real traffic.
const RATE_LIMIT = 10;          // max requests
const WINDOW_MS = 60 * 1000;    // per 60 seconds
const hits = new Map();         // ip -> array of timestamps

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);

  // Occasional cleanup so the Map doesn't grow forever across warm invocations
  if (hits.size > 5000) {
    for (const [key, arr] of hits) {
      if (arr.every(t => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return timestamps.length > RATE_LIMIT;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests, please slow down', demo: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured', demo: true });
  }

  const { input, mode } = req.body || {};
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Input is required' });
  }
  if (input.length < 3) {
    return res.status(400).json({ error: 'Input must be at least 3 characters' });
  }
  if (input.length > 10000) {
    return res.status(400).json({ error: 'Input must not exceed 10,000 characters' });
  }

  const isTopic = mode === 'topic' || input.trim().length < 100;

  const schemaFields = `- biasScore (number -100 to +100)
- biasRationale (string, brief explanation)
- credibilityScore (number 0-100)
- emotionalLanguage (number 0-100)
- sourceBalance (number 0-100)
- factualDensity (number 0-100)
- missingFacts (array of 3-7 objects with heading and description)
- conflictBackground (object with historicalSummary string and keyPlayers array of 2-6 objects with name and role)
- aiPrediction (object with primaryOutcome, confidencePercent 0-100, alternativeScenarios array of 2-4 objects with description, and disclaimer string)`;

  const SPECIFIC=`\n\nIMPORTANT: Base ALL fields — especially missingFacts, conflictBackground, and aiPrediction — specifically on the actual content/topic provided above. Reference the concrete people, places, events, and claims in the input. Do NOT return generic geopolitical boilerplate or template statements; every item must be clearly relevant and specific to this particular input. Vary wording naturally.`;

  const prompt = (isTopic
    ? `The following is a short TOPIC or phrase, not a full article. Provide a GENERAL analysis of how this topic is TYPICALLY covered across mainstream media and what context is COMMONLY MISSING from that coverage. Do not pretend a specific article was provided — assess the general media landscape around this topic.

For biasScore and credibilityScore, estimate the typical tendency of mainstream coverage on this topic. For missingFacts, list context commonly omitted from mainstream coverage on THIS topic. For biasRationale, explain the general framing patterns seen across outlets for THIS topic.

Return a JSON object with these fields:
${schemaFields}

Topic:
${input}`
    : `Analyze the following article text and return a JSON object with these fields:
${schemaFields}

Text to analyze:
${input}`)+SPECIFIC;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        })
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded', demo: true });
      }
      return res.status(502).json({ error: 'AI service error', demo: true });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI', demo: true });
    }

    let json = text.trim();
    if (json.startsWith('```')) {
      json = json.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(json);
    return res.status(200).json({ data: result });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timed out', demo: true });
    }
    return res.status(500).json({ error: 'Internal server error', demo: true });
  }
}