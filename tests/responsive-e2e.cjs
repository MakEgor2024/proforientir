const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
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
    '.webp': 'image/webp'
};

function makeServer() {
    return http.createServer((req, res) => {
        const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const filePath = path.resolve(root, relativePath);
        if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, 'index.html')) {
            res.writeHead(403).end('Forbidden');
            return;
        }
        fs.readFile(filePath, 'utf8', (error, content) => {
            if (error) {
                res.writeHead(404).end('Not found');
                return;
            }
            if (path.basename(filePath) === 'index.html') {
                content = content
                    .replace(/<script src="https:\/\/www\.gstatic\.com\/[^"]+" defer><\/script>/g, '')
                    .replace(/<script src="https:\/\/unpkg\.com\/lucide[^"]+" defer><\/script>/g, '')
                    .replace('<body class="light">', '<body class="light"><script>localStorage.setItem("proforientirEduLevel", "bachelor");</script>');
            }
            res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'text/plain; charset=utf-8' });
            res.end(content);
        });
    });
}

async function run() {
    const server = makeServer();
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
        window.confirm = () => true;
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', route => {
        const requestUrl = route.request().url();
        if (requestUrl.startsWith(baseUrl) || requestUrl.startsWith('data:')) return route.continue();
        return route.abort();
    });

    try {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() =>
            document.querySelectorAll('.profession-card').length >= 12
            && document.querySelectorAll('.uni-card').length >= 12,
            null,
            { timeout: 15000 }
        );

        const widths = [320, 360, 390, 430, 600, 768, 820, 821, 1024, 1440];
        const layoutReport = [];
        for (const width of widths) {
            await page.setViewportSize({ width, height: 844 });
            await page.waitForTimeout(80);
            const metrics = await page.evaluate(() => {
                const header = document.querySelector('header').getBoundingClientRect();
                const logo = document.querySelector('.logo-container').getBoundingClientRect();
                const controls = document.querySelector('.controls').getBoundingClientRect();
                const nav = document.querySelector('#primary-navigation');
                const menuButton = document.querySelector('#mobile-menu-toggle');
                return {
                    viewport: window.innerWidth,
                    document: document.documentElement.scrollWidth,
                    body: document.body.scrollWidth,
                    headerRight: Math.round(header.right),
                    logoRight: Math.round(logo.right),
                    controlsRight: Math.round(controls.right),
                    navDisplay: getComputedStyle(nav).display,
                    menuVisible: getComputedStyle(menuButton).display !== 'none'
                };
            });
            layoutReport.push(metrics);
            assert.ok(metrics.document <= width + 1, 'Горизонтальная прокрутка документа при ширине ' + width + 'px: ' + metrics.document + 'px');
            assert.ok(metrics.body <= width + 1, 'Горизонтальная прокрутка body при ширине ' + width + 'px: ' + metrics.body + 'px');
            assert.ok(metrics.headerRight <= width + 1, 'Шапка выходит за экран при ширине ' + width + 'px');
            if (width <= 820) {
                assert.equal(metrics.navDisplay, 'none', 'Мобильное меню должно быть закрыто при ' + width + 'px');
                assert.equal(metrics.menuVisible, true, 'Кнопка меню должна быть видна при ' + width + 'px');
            } else {
                assert.notEqual(metrics.navDisplay, 'none', 'Навигация должна быть видна на десктопе при ' + width + 'px');
                assert.equal(metrics.menuVisible, false, 'Кнопка меню должна быть скрыта на десктопе при ' + width + 'px');
            }
        }

        await page.setViewportSize({ width: 390, height: 844 });
        const menuButton = page.locator('#mobile-menu-toggle');
        await menuButton.click();
        assert.equal(await menuButton.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('#primary-navigation').evaluate(el => getComputedStyle(el).display), 'block');
        const menuRect = await page.locator('#primary-navigation').evaluate(el => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, width: r.width };
        });
        assert.ok(menuRect.left >= -1 && menuRect.right <= 391, 'Выпадающее меню выходит за границы экрана');
        await page.locator('#primary-navigation a[href="#test"]').click();
        assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', 'Меню должно закрываться после перехода');
        assert.equal(await page.locator('#primary-navigation').evaluate(el => getComputedStyle(el).display), 'none');

        await page.locator('.theme-switch').click();
        assert.ok(await page.locator('body').evaluate(el => el.classList.contains('dark')), 'Переключатель темы не включил тёмную тему');
        await page.locator('.theme-switch').click();
        assert.ok(!(await page.locator('body').evaluate(el => el.classList.contains('dark'))), 'Переключатель темы не вернул светлую тему');

        await page.locator('#start-test-btn').click();
        assert.equal(await page.locator('#questions-container .question').count(), 12, 'Тест должен отображать 12 вопросов');
        for (let question = 1; question <= 12; question++) {
            await page.locator('input[name="q' + question + '"]').first().check();
        }
        await page.locator('#career-test button[type="submit"]').click();
        assert.ok(!(await page.locator('#results').evaluate(el => el.classList.contains('hidden'))), 'Кнопка отправки теста не показывает результат');

        await page.locator('#profession-search').fill('инженер');
        await page.waitForTimeout(400);
        assert.ok(await page.locator('.profession-card').count() > 0, 'Поиск профессий не возвращает карточки');
        await page.locator('#profession-search').fill('');
        await page.locator('#profession-type-filter').selectOption('social');
        assert.ok(await page.locator('.profession-card').count() > 0, 'Фильтр профессий не возвращает карточки');
        await page.locator('#profession-type-filter').selectOption('all');
        const initialProfessionCount = await page.locator('.profession-card').count();
        await page.locator('#show-more-professions-btn').click();
        assert.ok(await page.locator('.profession-card').count() > initialProfessionCount, 'Кнопка показа дополнительных профессий не сработала');

        await page.locator('#show-more-universities-btn').click();
        assert.ok(await page.locator('.uni-card').count() > 12, 'Кнопка показа дополнительных вузов не сработала');
        await page.locator('.compare-checkbox').nth(0).check();
        assert.equal(await page.locator('#uni-modal').evaluate(el => el.style.display || 'none'), 'none', 'Выбор чекбокса сравнения не должен открывать карточку вуза');
        await page.locator('.compare-checkbox').nth(1).check();
        assert.ok(await page.locator('#compare-unis-btn').isEnabled(), 'Кнопка сравнения должна включаться после выбора двух вузов');
        await page.locator('#compare-unis-btn').click();
        assert.equal(await page.locator('#compare-modal').evaluate(el => el.style.display), 'block', 'Сравнение вузов не открыло модальное окно');
        await page.locator('#compare-modal .close').click();
        await page.locator('.uni-content[role="button"]').first().click();
        assert.equal(await page.locator('#uni-modal').evaluate(el => el.style.display), 'block', 'Карточка вуза не открывает подробности');
        await page.locator('#uni-modal .close').click();

        await page.locator('#login-btn').click();
        assert.equal(await page.locator('#auth-modal').evaluate(el => el.style.display), 'block', 'Кнопка входа не открывает форму авторизации');
        await page.locator('#auth-modal .close').click();

        const screenshotDir = path.join(root, 'artifacts');
        fs.mkdirSync(screenshotDir, { recursive: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(screenshotDir, 'mobile-390.png'), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.screenshot({ path: path.join(screenshotDir, 'desktop-1440.png'), fullPage: true });

        assert.deepEqual(pageErrors, [], 'Ошибки JavaScript в браузере: ' + pageErrors.join('; '));
        console.log(JSON.stringify({
            result: 'PASS',
            testedViewports: layoutReport,
            flows: [
                'mobile navigation open/close and anchor routing',
                'theme switch',
                '12-question Holland test submission',
                'profession search, type filter and pagination',
                'university pagination, compare selection, comparison modal and details modal',
                'login modal open/close'
            ],
            pageErrors
        }, null, 2));
    } finally {
        await context.close();
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});