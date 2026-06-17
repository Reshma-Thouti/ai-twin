
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

  const { question, systemPrompt } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question parameter is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Gemini API key is not configured on the Vercel server. Please add GEMINI_API_KEY to your Vercel environment variables.' 
    });
  }

  console.log(`[T.E.S.A Proxy] Request received. Active API Key Prefix: "${apiKey.substring(0, 6)}..." (Length: ${apiKey.length})`);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `${systemPrompt}\n\nUser query: ${question}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600
    }
  };

  try {
        let response;

        for (let attempt = 1; attempt <= 3; attempt++) {

          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

         
          if (response.ok) {
            break;
          }

         
          if (response.status === 503 && attempt < 3) {
            console.log(`[T.E.S.A Retry] Gemini busy. Retrying attempt ${attempt}/3`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }

          break;
        }

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404) {
        try {
          const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const modelNames = listData.models ? listData.models.map(m => m.name) : [];
            console.log(`[T.E.S.A Diagnostic] 404 Error: Available model list for this key:`, modelNames);
          } else {
            console.log(`[T.E.S.A Diagnostic] Failed to list models: Status ${listResponse.status}`);
          }
        } catch (listErr) {
          console.error(`[T.E.S.A Diagnostic] Error listing models:`, listErr);
        }
      }

      if (response.status === 503) {
        throw new Error(
          "T.E.S.A Cognitive Core is temporarily busy. Please try again in a few seconds."
        );
        }

      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
   
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("API Proxy Error:", err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: err.message });
  }
}
