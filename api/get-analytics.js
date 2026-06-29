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

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  try {
    if (!webhookUrl) {
      // Mock stats and logs if sheet is not linked
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

    const response = await fetch(webhookUrl);
    if (!response.ok) {
      throw new Error(`Google Sheet returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json({
      status: 'live',
      stats: data.stats,
      logs: data.logs
    });
  } catch (err) {
    console.error("Google Sheets Analytics Retrieval Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
