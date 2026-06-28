// C:\ai-twin\api\chat.js

module.exports = async function handler(req, res) {
  // Handle CORS options request
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

  // Print diagnostic log in Vercel console to help verify which key is being used
  console.log(`[T.E.S.A Proxy] Request received. Active API Key Prefix: "${apiKey.substring(0, 6)}..." (Length: ${apiKey.length})`);

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

  const getEndpoint = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let response;
  let success = false;
  let lastErrorText = "";
  let lastStatus = 200;

  try {
    for (const model of modelsToTry) {
      const endpoint = getEndpoint(model);
      console.log(`[T.E.S.A Proxy] Attempting call to model: ${model}`);
      
      try {
        for (let attempt = 1; attempt <= 2; attempt++) {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            success = true;
            break;
          }

          lastStatus = response.status;
          if (response.status === 503 && attempt < 2) {
            console.log(`[T.E.S.A Retry] Gemini busy for ${model}. Retrying attempt ${attempt}...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
          break;
        }

        if (success) {
          console.log(`[T.E.S.A Proxy] Successfully generated content using model: ${model}`);
          break;
        } else {
          lastErrorText = await response.text();
          console.warn(`[T.E.S.A Proxy] Model ${model} failed with status ${response.status}: ${lastErrorText}`);
          
          // Diagnostic logging if 404 (model not found)
          if (response.status === 404) {
            try {
              const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
              if (listResponse.ok) {
                const listData = await listResponse.json();
                const modelNames = listData.models ? listData.models.map(m => m.name) : [];
                console.log(`[T.E.S.A Diagnostic] Available models for this key:`, modelNames);
              }
            } catch (listErr) {
              console.error("[T.E.S.A Diagnostic] Error listing models:", listErr);
            }
          }
        }
      } catch (err) {
        lastErrorText = err.message;
        lastStatus = 500;
        console.warn(`[T.E.S.A Proxy] Network error for model ${model}: ${err.message}`);
      }
    }

    if (!success) {
      if (lastStatus === 503) {
        throw new Error("T.E.S.A Cognitive Core is temporarily busy. Please try again in a few seconds.");
      }
      throw new Error(`Gemini API returned status ${lastStatus}: ${lastErrorText}`);
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
