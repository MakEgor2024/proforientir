const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
};
const compressible = new Set(['.html', '.css', '.js', '.json', '.svg']);

function createStaticServer() {
    return http.createServer((req, res) => {
        let pathname;
        try {
            pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        } catch (_) {
            res.writeHead(400).end('Bad request');
            return;
        }

        const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const filePath = path.resolve(root, relativePath);
        if (!filePath.startsWith(root + path.sep)) {
            res.writeHead(403).end('Forbidden');
            return;
        }

        fs.readFile(filePath, (error, data) => {
            if (error) {
                res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
                return;
            }

            const extension = path.extname(filePath).toLowerCase();
            const headers = {
                'Content-Type': mimeTypes[extension] || 'application/octet-stream',
                'X-Content-Type-Options': 'nosniff',
                'Vary': 'Accept-Encoding'
            };

            if (extension === '.html') {
                headers['Cache-Control'] = 'no-cache';
            } else {
                headers['Cache-Control'] = 'public, max-age=3600';
            }

            const acceptsBrotli = /\bbr\b/.test(req.headers['accept-encoding'] || '');
            const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
            if (compressible.has(extension) && acceptsBrotli) {
                const compressed = zlib.brotliCompressSync(data);
                headers['Content-Encoding'] = 'br';
                headers['Content-Length'] = String(compressed.length);
                res.writeHead(200, headers).end(compressed);
                return;
            }
            if (compressible.has(extension) && acceptsGzip) {
                const compressed = zlib.gzipSync(data);
                headers['Content-Encoding'] = 'gzip';
                headers['Content-Length'] = String(compressed.length);
                res.writeHead(200, headers).end(compressed);
                return;
            }

            headers['Content-Length'] = String(data.length);
            res.writeHead(200, headers).end(data);
        });
    });
}

function getAuditMetric(lhr, auditId) {
    const audit = lhr.audits[auditId];
    if (!audit || typeof audit.numericValue !== 'number') return null;
    return Math.round(audit.numericValue * 100) / 100;
}

async function main() {
    const { default: lighthouse } = await import('lighthouse');
    const { launch } = await import('chrome-launcher');

    const server = createStaticServer();
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    const url = 'http://127.0.0.1:' + address.port + '/';
    let chrome;

    try {
        chrome = await launch({
            chromePath: chromium.executablePath(),
            chromeFlags: [
                '--headless',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-networking',
                '--disable-extensions'
            ]
        });

        const result = await lighthouse(url, {
            port: chrome.port,
            logLevel: 'error',
            output: 'html',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            formFactor: 'mobile',
            throttlingMethod: 'simulate',
            maxWaitForFcp: 30000,
            maxWaitForLoad: 60000
        });

        const lhr = result.lhr;
        const score = category => {
            const value = lhr.categories[category]?.score;
            return value == null ? null : Math.round(value * 100);
        };
        const metrics = {
            fcpMs: getAuditMetric(lhr, 'first-contentful-paint'),
            lcpMs: getAuditMetric(lhr, 'largest-contentful-paint'),
            cls: getAuditMetric(lhr, 'cumulative-layout-shift'),
            tbtMs: getAuditMetric(lhr, 'total-blocking-time'),
            speedIndexMs: getAuditMetric(lhr, 'speed-index'),
            interactiveMs: getAuditMetric(lhr, 'interactive')
        };
        const opportunities = Object.values(lhr.audits)
            .filter(audit => audit.details?.type === 'opportunity' && audit.details.overallSavingsMs > 0)
            .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
            .slice(0, 10)
            .map(audit => ({
                id: audit.id,
                title: audit.title,
                displayValue: audit.displayValue || null,
                estimatedSavingsMs: Math.round(audit.details.overallSavingsMs)
            }));
        const report = {
            url,
            lighthouseVersion: lhr.lighthouseVersion,
            userAgent: lhr.userAgent,
            formFactor: lhr.configSettings?.formFactor || 'mobile',
            scores: {
                performance: score('performance'),
                accessibility: score('accessibility'),
                bestPractices: score('best-practices'),
                seo: score('seo')
            },
            metrics,
            opportunities,
            testedAt: new Date().toISOString()
        };

        fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
        fs.writeFileSync(
            path.join(root, 'artifacts', 'lighthouse-mobile.json'),
            JSON.stringify({ summary: report, lhr }, null, 2)
        );
        fs.writeFileSync(path.join(root, 'artifacts', 'lighthouse-mobile.html'), result.report);
        console.log(JSON.stringify(report, null, 2));

        if (!lhr.categories.performance || !Number.isFinite(lhr.categories.performance.score)) {
            throw new Error('Lighthouse did not return a performance score');
        }
    } finally {
        if (chrome) await chrome.kill();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});