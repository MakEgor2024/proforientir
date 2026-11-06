const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, request: playwrightRequest } = require('playwright');

const root = path.resolve(__dirname, '..');
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
};

function createStaticServer() {
    return http.createServer((req, res) => {
        const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const filePath = path.resolve(root, relative);
        if (!filePath.startsWith(root + path.sep)) {
            res.writeHead(403).end('Forbidden');
            return;
        }
        fs.readFile(filePath, (error, data) => {
            if (error) {
                res.writeHead(404).end('Not found');
                return;
            }
            res.writeHead(200, {
                'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
                'Cache-Control': 'no-store'
            });
            res.end(data);
        });
    });
}

async function checkImageUrl(api, url) {
    let response;
    let method = 'HEAD';
    let errorMessage = null;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            response = attempt === 0
                ? await api.head(url, { timeout: 15000, maxRedirects: 10 })
                : await api.get(url, { timeout: 20000, maxRedirects: 10, headers: { Range: 'bytes=0-0' } });
            if (attempt === 1) method = 'GET';
            if (response.status() === 200) break;
            errorMessage = 'HTTP ' + response.status();
        } catch (error) {
            errorMessage = error.message;
            method = attempt === 0 ? 'HEAD' : 'GET';
        }
    }
    const headers = response ? response.headers() : {};
    const contentType = headers['content-type'] || '';
    return {
        url,
        status: response ? response.status() : null,
        method,
        contentType,
        contentLength: Number(headers['content-length'] || 0) || null,
        finalUrl: response ? response.url() : null,
        ok: Boolean(response && response.status() === 200 && contentType.toLowerCase().startsWith('image/')),
        error: errorMessage
    };
}

async function main() {
    const universities = JSON.parse(fs.readFileSync(path.join(root, 'universities.json'), 'utf8'));
    assert.ok(Array.isArray(universities) && universities.length > 0, 'Каталог вузов не загружен');
    const imageMap = new Map();
    for (const university of universities) {
        if (!university.imageUrl) {
            throw new Error('У организации нет imageUrl: ' + university.name);
        }
        if (!/^https?:\/\//i.test(university.imageUrl)) {
            throw new Error('Некорректный URL изображения: ' + university.name);
        }
        if (!imageMap.has(university.imageUrl)) imageMap.set(university.imageUrl, []);
        imageMap.get(university.imageUrl).push(university.name);
    }

    const uniqueImageUrls = [...imageMap.keys()];
    const api = await playwrightRequest.newContext({
        timeout: 20000,
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: { 'User-Agent': 'Proforientir-Image-Audit/1.0' }
    });
    const imageChecks = [];
    for (let i = 0; i < uniqueImageUrls.length; i += 6) {
        const batch = uniqueImageUrls.slice(i, i + 6);
        imageChecks.push(...await Promise.all(batch.map(url => checkImageUrl(api, url))));
    }
    await api.dispose();

    const brokenImages = imageChecks.filter(item => !item.ok);
    const duplicateImages = [...imageMap.entries()]
        .filter(([, names]) => names.length > 1)
        .map(([url, names]) => ({ url, usedBy: names }));

    const server = createStaticServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const baseUrl = 'http://127.0.0.1:' + address.port;
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        serviceWorkers: 'block',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
    });
    await context.addInitScript(() => {
        localStorage.setItem('proforientirEduLevel', 'bachelor');
        const authApi = {
            currentUser: null,
            onAuthStateChanged(callback) { callback(null); },
            signOut: async () => ({}),
            createUserWithEmailAndPassword: async () => ({ user: null }),
            signInWithEmailAndPassword: async () => ({ user: null }),
            signInWithPopup: async () => ({ user: null })
        };
        function firestore() {
            return {
                collection() {
                    return {
                        doc() {
                            return {
                                get: async () => ({ exists: false, data: () => ({}) }),
                                set: async () => ({}),
                                update: async () => ({}),
                                delete: async () => ({})
                            };
                        }
                    };
                }
            };
        }
        firestore.FieldValue = {
            arrayUnion: value => value,
            arrayRemove: value => value
        };
        const firebase = {
            apps: [],
            initializeApp(config) { this.apps.push({ config }); },
            auth: () => authApi,
            firestore
        };
        firebase.auth.GoogleAuthProvider = function GoogleAuthProvider() {};
        window.firebase = firebase;
        window.lucide = { createIcons() {} };
        window.__vitals = { lcp: 0, cls: 0 };
        try {
            new PerformanceObserver(list => {
                for (const entry of list.getEntries()) window.__vitals.lcp = Math.max(window.__vitals.lcp, entry.startTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch (_) {}
        window.__imageEvents = { loaded: 0, failed: 0 };
        document.addEventListener('load', event => {
            if (event.target instanceof HTMLImageElement) window.__imageEvents.loaded++;
        }, true);
        document.addEventListener('error', event => {
            if (event.target instanceof HTMLImageElement) window.__imageEvents.failed++;
        }, true);
    });

    const page = await context.newPage();
    const pageErrors = [];
    const imageResponses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
        if (response.request().resourceType() === 'image') {
            imageResponses.push({
                url: response.url(),
                status: response.status(),
                contentType: response.headers()['content-type'] || ''
            });
        }
    });
    await page.route('**/*', route => {
        const req = route.request();
        const url = req.url();
        if (url.startsWith(baseUrl)) return route.continue();
        if (req.resourceType() === 'image') return route.continue();
        return route.abort();
    });

    try {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 150,
            downloadThroughput: (1.6 * 1024 * 1024) / 8,
            uploadThroughput: (750 * 1024) / 8,
            connectionType: 'cellular3g'
        });

        const navigationStart = Date.now();
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() =>
            document.querySelectorAll('.profession-card').length >= 12 &&
            document.querySelectorAll('.uni-card').length >= 12,
            null,
            { timeout: 20000 }
        );
        await page.waitForTimeout(1000);
        const firstPaintMetrics = await page.evaluate(() => {
            const paints = performance.getEntriesByType('paint');
            const fcp = paints.find(entry => entry.name === 'first-contentful-paint');
            return {
                fcpMs: fcp ? Math.round(fcp.startTime) : null,
                lcpMs: Math.round(window.__vitals.lcp),
                cls: Number(window.__vitals.cls.toFixed(4)),
                domContentLoadedMs: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
                firstPartyResources: performance.getEntriesByType('resource')
                    .filter(entry => entry.name.startsWith(location.origin))
                    .map(entry => ({
                        name: new URL(entry.name).pathname,
                        transferBytes: entry.transferSize || 0,
                        encodedBytes: entry.encodedBodySize || 0,
                        durationMs: Math.round(entry.duration)
                    }))
            };
        });

        await page.locator('#universities').scrollIntoViewIfNeeded();
        const firstImages = page.locator('.uni-card-image img');
        const imageCount = await firstImages.count();
        for (let i = 0; i < imageCount; i++) {
            await firstImages.nth(i).scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        }
        await page.waitForTimeout(8000);

        const renderedImageStats = await page.evaluate(() => {
            const containers = [...document.querySelectorAll('.uni-card-image')];
            return {
                rendered: containers.length,
                visibleImages: containers.filter(container => {
                    const img = container.querySelector('img');
                    return img && img.complete && img.naturalWidth > 0;
                }).length,
                fallbackCards: containers.filter(container => container.classList.contains('img-fallback')).length,
                pendingImages: containers.filter(container => {
                    const img = container.querySelector('img');
                    return img && !img.complete;
                }).length,
                lazyCount: document.querySelectorAll('.uni-card-image img[loading="lazy"]').length,
                responsiveSrcsetCount: containers.filter(container => {
                    const img = container.querySelector('img');
                    const srcset = img?.getAttribute('srcset') || '';
                    return srcset.includes('400w') && srcset.includes('800w') && Boolean(img?.getAttribute('sizes'));
                }).length,
                selectedWidths: containers.map(container => {
                    const img = container.querySelector('img');
                    if (!img || !img.currentSrc) return null;
                    const url = new URL(img.currentSrc);
                    return Number(url.searchParams.get('w') || url.searchParams.get('width') || 0) || null;
                }).filter(Boolean)
            };
        });

        const resources = await page.evaluate(() => performance.getEntriesByType('resource')
            .filter(entry => entry.name.startsWith(location.origin))
            .map(entry => ({
                path: new URL(entry.name).pathname,
                encodedBytes: entry.encodedBodySize || 0
            })));
        const firstPartyBytes = resources.reduce((sum, entry) => sum + entry.encodedBytes, 0);
        const report = {
            result: brokenImages.length === 0 && pageErrors.length === 0 ? 'PASS' : 'FAIL',
            environment: {
                viewport: '390x844',
                network: 'simulated cellular 3G (150ms latency, 1.6Mbps download)',
                browser: 'Chromium via Playwright'
            },
            catalog: {
                organizations: universities.length,
                uniqueImageUrls: uniqueImageUrls.length,
                duplicateImageUrls: duplicateImages.length,
                duplicateImageGroups: duplicateImages
            },
            imageUrlChecks: {
                checked: imageChecks.length,
                passed: imageChecks.length - brokenImages.length,
                failed: brokenImages.length,
                failures: brokenImages,
                results: imageChecks
            },
            renderedImages: {
                ...renderedImageStats,
                imageResponses: imageResponses.length,
                imageResponsesFailed: imageResponses.filter(item => item.status < 200 || item.status >= 400).length,
                imageEvents: await page.evaluate(() => window.__imageEvents)
            },
            performance: {
                ...firstPaintMetrics,
                firstPartyBytes,
                firstPartyResources: resources
            },
            javascriptErrors: pageErrors,
            elapsedMs: Date.now() - navigationStart
        };

        fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
        fs.writeFileSync(path.join(root, 'artifacts', 'performance-report.json'), JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report, null, 2));

        assert.equal(brokenImages.length, 0, 'Не все URL изображений доступны: ' + brokenImages.map(item => item.url + ' (' + item.error + ')').join('; '));
        assert.equal(pageErrors.length, 0, 'Ошибки JavaScript: ' + pageErrors.join('; '));
        assert.equal(renderedImageStats.pendingImages, 0, 'Остались незавершённые запросы изображений после ожидания');
        assert.equal(renderedImageStats.responsiveSrcsetCount, renderedImageStats.rendered,
            'Для каждой карточки должен быть выбран адаптивный srcset 400/800 px');
        assert.ok(firstPartyBytes < 300000, 'Объём первых локальных ресурсов превысил бюджет 300 КБ: ' + firstPartyBytes);
        assert.ok(firstPaintMetrics.fcpMs !== null && firstPaintMetrics.fcpMs < 2500,
            'FCP на тестовом мобильном соединении должен быть меньше 2,5 сек: ' + firstPaintMetrics.fcpMs);
        assert.ok(firstPaintMetrics.cls <= 0.1, 'CLS на первом экране выше 0,1: ' + firstPaintMetrics.cls);
    } finally {
        await context.close();
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});