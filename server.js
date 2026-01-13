const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.post('/.netlify/functions/gemini-proxy', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: { message: 'Prompt is required' } });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'API Key not configured' } });
    }
    
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    
    const data = await response.json();
    if (!response.ok || data.error) {
      console.error('Gemini API Error details:', JSON.stringify(data, null, 2));
      const statusCode = response.status || 500;
      return res.status(statusCode).json({ 
        error: { 
          message: data.error?.message || 'API Error',
          details: data.error
        } 
      });
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) {
        console.error('Empty response from Gemini:', JSON.stringify(data, null, 2));
    }
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

app.use(express.static(path.join(__dirname)));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
