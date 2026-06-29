const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, query, metadata } = req.body;

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("[T.E.S.A Analytics] Vercel KV credentials missing. Running offline mode.");
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ status: 'offline', message: 'Logged locally only due to missing KV credentials.' });
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      type, // "query", "tab-swap", "download", "quiz-score"
      query: query || "",
      metadata: metadata || {},
      timestamp
    };

    await kv.lpush('tesa_interaction_logs', JSON.stringify(logEntry));
    await kv.ltrim('tesa_interaction_logs', 0, 999); // Keep last 1000 logs

    if (type === 'download') {
      await kv.incr('tesa_stat_downloads');
    } else if (type === 'quiz-score') {
      await kv.incr('tesa_stat_quizzes');
    } else if (type === 'query') {
      await kv.incr('tesa_stat_queries');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error("Analytics Logger Error:", err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: err.message });
  }
};
