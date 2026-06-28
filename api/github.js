// C:\ai-twin\api\github.js

module.exports = async function handler(req, res) {
  // Handle CORS options request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache response for 10 minutes (600 seconds) in Vercel Edge Network
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=30');

  try {
    const response = await fetch("https://api.github.com/users/Reshma-Thouti/events", {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TESA-AI-Twin-Portfolio'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("GitHub Event Proxy Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
