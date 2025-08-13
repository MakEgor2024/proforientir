// Файл: netlify/functions/gemini-proxy.js
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: { message: 'Prompt is required' } })};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: { message: 'API Key not configured' } })};
    
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    if (!response.ok || data.error) return { statusCode: response.status, body: JSON.stringify({ error: { message: data.error?.message || 'API Error' } })};
    
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: data.candidates[0]?.content?.parts[0]?.text || '' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: error.message } }) };
  }
};

