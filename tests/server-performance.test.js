const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const zlib = require('node:zlib');

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

test.after(() => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});

test('static JavaScript is Brotli-compressed and keeps cache validators', async () => {
  const response = await request('/script.js', 'br, gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'br');
  assert.match(response.headers['cache-control'] || '', /max-age=3600/);
  assert.match(response.headers.vary || '', /accept-encoding/i);
  assert.ok(response.headers.etag, 'static assets should retain an ETag');

  const decoded = zlib.brotliDecompressSync(response.body);
  assert.deepEqual(decoded, fs.readFileSync(path.join(root, 'script.js')));
});

test('static CSS falls back to gzip when Brotli is unavailable', async () => {
  const response = await request('/style.css', 'gzip');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'gzip');
  assert.match(response.headers['cache-control'] || '', /max-age=3600/);
  const decoded = zlib.gunzipSync(response.body);
  assert.deepEqual(decoded, fs.readFileSync(path.join(root, 'style.css')));
});

test('static JSON is served compressed without changing its content', async () => {
  const response = await request('/universities.json', 'br');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-encoding'], 'br');
  const decoded = zlib.brotliDecompressSync(response.body).toString('utf8');
  assert.doesNotThrow(() => JSON.parse(decoded));
});
