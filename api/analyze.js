// Simple daily usage cap: each user gets 7 analyses per day, resetting at midnight UTC.
// Tracked in-memory per IP address (no login system exists, so IP is the best available identifier).
// NOTE: this resets if the serverless function cold-starts, and is shared by users on the same
// network/IP. That's the practical ceiling without adding accounts + a database.
const DAILY_LIMIT = 7;
const usage = new Map(); // key: "ip:YYYY-MM-DD" -> count

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function dailyLimitReached(ip) {
  const key = ip + ':' + todayUTC();
  return (usage.get(key) || 0) >= DAILY_LIMIT;
}

function recordUsage(ip) {
  const today = todayUTC();
  const key = ip + ':' + today;
  usage.set(key, (usage.get(key) || 0) + 1);

  // Occasional cleanup: drop any entries not from today so the Map doesn't grow forever.
  if (usage.size > 5000) {
    for (const k of usage.keys()) {
      if (!k.endsWith(today)) usage.delete(k);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (dailyLimitReached(ip)) {
    return res.status(429).json({
      error: 'Your daily limit of 7 analyses has been reached. Please try again tomorrow.',
      dailyLimitReached: true
    });
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
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
    recordUsage(ip);
    return res.status(200).json({ data: result });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timed out', demo: true });
    }
    return res.status(500).json({ error: 'Internal server error', demo: true });
  }
}
