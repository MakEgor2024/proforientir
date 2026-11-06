const express = require('express');
const path = require('path');
const zlib = require('node:zlib');
const app = express();

app.use(express.json());

// Compress text-based static responses before they leave the app server.
// Brotli is preferred; gzip is used for older clients. Images are already compressed.
const compressibleExtensions = new Set(['.html', '.css', '.js', '.json', '.svg']);

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  let requestPath = '/';
  try {
    requestPath = new URL(req.url, 'http://localhost').pathname.toLowerCase();
  } catch (_) {
    return next();
  }
  const extension = path.extname(requestPath);
  // Keep photos, fonts, archives, and other binary assets streaming normally.
  // Extensionless routes resolve to the HTML application shell.
  if (extension && !compressibleExtensions.has(extension)) return next();

  const currentVary = String(res.getHeader('Vary') || '');
  if (!currentVary.split(',').some(value => value.trim().toLowerCase() === 'accept-encoding')) {
    res.setHeader('Vary', currentVary ? currentVary + ', Accept-Encoding' : 'Accept-Encoding');
  }
  if (req.headers.range) return next();

  const acceptedEncodings = (req.headers['accept-encoding'] || '')
    .split(',')
    .map(value => {
      const [name, ...parameters] = value.trim().toLowerCase().split(';');
      const qualityParameter = parameters.find(parameter => parameter.trim().startsWith('q='));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return { name, quality: Number.isFinite(quality) ? quality : 0 };
    });
  const supports = name => acceptedEncodings.some(item => item.name === name && item.quality > 0);
  const encoding = supports('br') ? 'br' : supports('gzip') ? 'gzip' : null;
  if (!encoding) return next();

  const bufferedChunks = [];
  const writeCallbacks = [];
  const originalEnd = res.end.bind(res);

  res.write = (chunk, encodingOrCallback, callback) => {
    if (chunk !== undefined && chunk !== null) {
      const chunkEncoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined;
      bufferedChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, chunkEncoding));
    }
    const writeCallback = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
    if (writeCallback) writeCallbacks.push(writeCallback);
    return true;
  };

  res.end = (chunk, encodingOrCallback, callback) => {
    if (chunk !== undefined && chunk !== null) {
      const chunkEncoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined;
      bufferedChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, chunkEncoding));
    }
    const endCallback = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
    const body = Buffer.concat(bufferedChunks);
    const contentType = String(res.getHeader('Content-Type') || '');
    const isCompressible = /^(text\/(html|css|javascript|plain)|application\/(javascript|json)|image\/svg\+xml)/i.test(contentType);
    const shouldCompress = res.statusCode === 200
      && !res.headersSent
      && !res.hasHeader('Content-Encoding')
      && isCompressible
      && body.length >= 1024;

    const finish = () => {
      for (const writeCallback of writeCallbacks) writeCallback();
      if (endCallback) endCallback();
    };

    if (!shouldCompress) {
      return originalEnd(body.length ? body : undefined, finish);
    }

    const compressor = encoding === 'br' ? zlib.brotliCompress : zlib.gzip;
    compressor(body, (error, compressedBody) => {
      if (error) {
        originalEnd(body, finish);
        return;
      }
      res.setHeader('Content-Encoding', encoding);
      res.removeHeader('Content-Length');
      const vary = String(res.getHeader('Vary') || '');
      if (!vary.split(',').some(value => value.trim().toLowerCase() === 'accept-encoding')) {
        res.setHeader('Vary', vary ? vary + ', Accept-Encoding' : 'Accept-Encoding');
      }
      originalEnd(compressedBody, finish);
    });
    return res;
  };

  next();
});



app.post('/.netlify/functions/gemini-proxy', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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

app.use(express.static(path.join(__dirname), {
  etag: true,
  lastModified: true,
  maxAge: '1h'
}));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
