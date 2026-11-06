const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const zlib = require('node:zlib');

const compressionResults = [];

const root = path.resolve(__dirname, '..');
let serverProcess;
let serverStderr = '';
let serverExit = null;
let baseUrl;

function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function request(pathname, acceptEncoding) {
  return new Promise((resolve, reject) => {
    const headers = acceptEncoding ? { 'Accept-Encoding': acceptEncoding } : {};
    const req = http.get(baseUrl + pathname, { headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.once('error', reject);
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await request('/index.html');
      if (response.status === 200) return;
      lastError = new Error('HTTP ' + response.status);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Сервер не запустился');
}

test.before(async () => {
  const port = await reservePort();
  baseUrl = 'http://127.0.0.1:' + port;
  serverProcess = spawn(process.execPath, [path.join(root, 'server.js')], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  serverProcess.stderr.setEncoding('utf8');
  serverProcess.stderr.on('data', chunk => { serverStderr += chunk; });
  serverProcess.once('exit', (code, signal) => { serverExit = { code, signal }; });
  try {
    await waitForServer();
  } catch (error) {
    throw new Error('Express-сервер не запустился. Exit: ' + JSON.stringify(serverExit) +
      '. stderr: ' + serverStderr + '. Причина: ' + error.message);
  }
});

test('binary image assets stay uncompressed and stream with their original bytes', async () => {
  const imagePath = '/attached_assets/targeted_element_1768496560932.png';
  const response = await request(imagePath, 'br, gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'image/png');
  assert.equal(response.headers['content-encoding'], undefined,
    'already-compressed images must not be buffered or recompressed');
  assert.deepEqual(response.body, fs.readFileSync(path.join(root, imagePath)));
});

test.after(() => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'artifacts', 'compression-report.json'),
    JSON.stringify({
      result: 'PASS',
      resources: compressionResults,
      totalOriginalBytes: compressionResults.reduce((sum, item) => sum + item.originalBytes, 0),
      totalCompressedBytes: compressionResults.reduce((sum, item) => sum + item.compressedBytes, 0),
      totalSavedBytes: compressionResults.reduce((sum, item) => sum + item.savedBytes, 0),
      totalSavedPercent: compressionResults.length
        ? Math.round((1 - compressionResults.reduce((sum, item) => sum + item.compressedBytes, 0) /
          compressionResults.reduce((sum, item) => sum + item.originalBytes, 0)) * 1000) / 10
        : 0
    }, null, 2)
  );
});

test('HTML entry point is Brotli-compressed for the initial page load', async () => {
  const response = await request('/', 'br, gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'br');
  assert.match(response.headers['cache-control'] || '', /max-age=3600/);
  assert.match(response.headers.vary || '', /accept-encoding/i);
  const source = fs.readFileSync(path.join(root, 'index.html'));
  const decoded = zlib.brotliDecompressSync(response.body);
  assert.deepEqual(decoded, source);
  assert.ok(response.body.length < source.length * 0.9, 'Brotli должно уменьшать HTML хотя бы на 10%');
  compressionResults.push({
    resource: 'index.html',
    encoding: 'br',
    originalBytes: source.length,
    compressedBytes: response.body.length,
    savedBytes: source.length - response.body.length,
    savedPercent: Math.round((1 - response.body.length / source.length) * 1000) / 10
  });
});

test('static JavaScript is Brotli-compressed and keeps cache validators', async () => {
  const response = await request('/script.js', 'br, gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'br');
  assert.match(response.headers['cache-control'] || '', /max-age=3600/);
  assert.match(response.headers.vary || '', /accept-encoding/i);
  assert.ok(response.headers.etag, 'static assets should retain an ETag');

  const source = fs.readFileSync(path.join(root, 'script.js'));
  const decoded = zlib.brotliDecompressSync(response.body);
  assert.deepEqual(decoded, source);
  assert.ok(response.body.length < source.length * 0.9, 'Brotli должно уменьшать размер JS хотя бы на 10%');
  compressionResults.push({
    resource: 'script.js',
    encoding: 'br',
    originalBytes: source.length,
    compressedBytes: response.body.length,
    savedBytes: source.length - response.body.length,
    savedPercent: Math.round((1 - response.body.length / source.length) * 1000) / 10
  });
});

test('static CSS falls back to gzip when Brotli is unavailable', async () => {
  const response = await request('/style.css', 'gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'gzip');
  assert.match(response.headers['cache-control'] || '', /max-age=3600/);
  const source = fs.readFileSync(path.join(root, 'style.css'));
  const decoded = zlib.gunzipSync(response.body);
  assert.deepEqual(decoded, source);
  assert.ok(response.body.length < source.length * 0.9, 'Gzip должно уменьшать размер CSS хотя бы на 10%');
  compressionResults.push({
    resource: 'style.css',
    encoding: 'gzip',
    originalBytes: source.length,
    compressedBytes: response.body.length,
    savedBytes: source.length - response.body.length,
    savedPercent: Math.round((1 - response.body.length / source.length) * 1000) / 10
  });
});

test('static JSON is served compressed without changing its content', async () => {
  const response = await request('/universities.json', 'br');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'br');
  const source = fs.readFileSync(path.join(root, 'universities.json'));
  const decoded = zlib.brotliDecompressSync(response.body);
  assert.deepEqual(decoded, source);
  assert.ok(response.body.length < source.length * 0.9, 'Brotli должно уменьшать размер JSON хотя бы на 10%');
  compressionResults.push({
    resource: 'universities.json',
    encoding: 'br',
    originalBytes: source.length,
    compressedBytes: response.body.length,
    savedBytes: source.length - response.body.length,
    savedPercent: Math.round((1 - response.body.length / source.length) * 1000) / 10
  });
});
