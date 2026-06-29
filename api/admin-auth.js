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

  const { password } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || "ReshmaAdmin2026";

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (password === correctPassword) {
    const token = Buffer.from(correctPassword + ":" + Date.now()).toString('base64');
    return res.status(200).json({ authenticated: true, token });
  } else {
    return res.status(401).json({ authenticated: false, error: 'Access Denied: Invalid Passcode.' });
  }
};
