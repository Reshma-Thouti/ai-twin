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

  const { token } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || "ReshmaAdmin2026";

  let isAuthenticated = false;
  try {
    if (token) {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.startsWith(correctPassword + ":")) {
        isAuthenticated = true;
      }
    }
  } catch (e) {}

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!isAuthenticated) {
    return res.status(403).json({ error: 'Forbidden: Invalid Admin Session.' });
  }

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(200).json({
        status: 'mocked',
        stats: {
          downloads: 14,
          quizzes: 8,
          queries: 142
        },
        logs: [
          { type: 'query', query: 'What are Reshma\'s Python projects?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { type: 'download', query: 'Reshma_Thouti_Resume.pdf', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
          { type: 'quiz-score', query: 'Stark Trivia completed: 3/3', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { type: 'query', query: 'Does she know Manifest V3 browser extensions?', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() }
        ]
      });
    }

    const logs = await kv.lrange('tesa_interaction_logs', 0, 100);
    const downloads = (await kv.get('tesa_stat_downloads')) || 0;
    const quizzes = (await kv.get('tesa_stat_quizzes')) || 0;
    const queries = (await kv.get('tesa_stat_queries')) || 0;

    const parsedLogs = logs.map(log => {
      try {
        return typeof log === 'string' ? JSON.parse(log) : log;
      } catch (e) {
        return log;
      }
    });

    return res.status(200).json({
      status: 'live',
      stats: {
        downloads: parseInt(downloads, 10),
        quizzes: parseInt(quizzes, 10),
        queries: parseInt(queries, 10)
      },
      logs: parsedLogs
    });
  } catch (err) {
    console.error("Analytics Retrieval Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
