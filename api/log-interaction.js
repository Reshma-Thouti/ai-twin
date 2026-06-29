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
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  try {
    if (!webhookUrl) {
      console.warn("[T.E.S.A Analytics] GOOGLE_SHEET_WEBHOOK_URL missing. Running offline mode.");
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ status: 'offline', message: 'Logged locally only due to missing webhook URL.' });
    }

    // Post to Google Apps Script Web App
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, query, metadata })
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error("Google Sheets Analytics Logger Error:", err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: err.message });
  }
};
