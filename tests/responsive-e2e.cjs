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
        let authStateListener = null;
        window.__authObserverRegistered = false;
        const authApi = {
            currentUser: null,
            onAuthStateChanged(callback) {
                authStateListener = callback;
                window.__authObserverRegistered = true;
                callback(authApi.currentUser);
            },
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
            auth: () => authApi
        };
        firebase.auth.GoogleAuthProvider = function GoogleAuthProvider() {};
        window.firebase = firebase;
        window.__firestoreLoadCount = 0;
        window.__installTestFirestore = () => {
            if (typeof firebase.firestore !== 'function') {
                firebase.firestore = firestore;
                window.__firestoreLoadCount += 1;
            }
        };
        window.__setTestAuthUser = user => {
            authApi.currentUser = user;
            if (authStateListener) authStateListener(user);
        };
        window.lucide = {
            createIcons() {
                const icons = {
                    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
                    x: '<path d="m18 6-12 12M6 6l12 12"/>',
                    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/>',
                    'graduation-cap': '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
                    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
                    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/>',
                    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
                    'log-in': '<path d="M10 17l5-5-5-5M15 12H3M21 3v18"/>',
                    'log-out': '<path d="M14 17l5-5-5-5M19 12H8M3 3v18"/>',
                    heart: '<path d="M20.8 8.8c0 5.4-8.8 11-8.8 11S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>'
                };
                document.querySelectorAll('[data-lucide]').forEach(node => {
                    const name = node.getAttribute('data-lucide');
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    svg.setAttribute('width', '18');
                    svg.setAttribute('height', '18');
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                    svg.setAttribute('stroke-width', '1.8');
                    svg.setAttribute('stroke-linecap', 'round');
                    svg.setAttribute('stroke-linejoin', 'round');
                    svg.setAttribute('aria-hidden', 'true');
                    svg.setAttribute('class', node.getAttribute('class') || 'icon');
                    svg.innerHTML = icons[name] || '<circle cx="12" cy="12" r="8"/>';
                    node.replaceWith(svg);
                });
            }
        };
        window.confirm = () => true;
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', async route => {
        const requestUrl = route.request().url();
        if (requestUrl === 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js') {
            return route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.__installTestFirestore();'
            });
        }
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
        const initialFirestoreState = await page.evaluate(() => ({
            sdkAvailable: typeof window.firebase.firestore === 'function',
            loadCount: window.__firestoreLoadCount
        }));
        assert.deepEqual(initialFirestoreState, { sdkAvailable: false, loadCount: 0 },
            'Firestore не должен загружаться для неавторизованного посетителя');
        assert.equal(await page.evaluate(() => window.__authObserverRegistered), false,
            'Проверка сессии не должна запускаться до отрисовки первого экрана');
        const creditStats = await page.evaluate(() => {
            const credits = [...document.querySelectorAll('.uni-image-credit')];
            const commons = credits.filter(el => el.dataset.creditType === 'commons');
            const official = credits.filter(el => el.dataset.creditType === 'official');
            return {
                count: credits.length,
                commonsCount: commons.length,
                officialCount: official.length,
                allHaveSource: credits.every(el => {
                    const link = el.querySelector('[data-credit-source]');
                    if (!link) return false;
                    if (el.dataset.creditType === 'commons') return link.href.startsWith('https://commons.wikimedia.org/wiki/File:');
                    if (el.dataset.creditType === 'official') return link.href.startsWith('https://inpsycho.ru/');
                    return false;
                }),
                allCommonsHaveLicense: commons.every(el => {
                    const link = el.querySelector('[data-credit-license]');
                    return link && /creativecommons.org|artlibre.org/.test(link.href);
                }),
                allOpenSafely: credits.every(el => [...el.querySelectorAll('a')].every(a =>
                    a.target === '_blank' && a.rel.includes('noopener') && a.rel.includes('noreferrer')
                ))
            };
        });
        assert.ok(creditStats.count > 0, 'В карточках должны отображаться подписи источников фото');
        assert.ok(creditStats.allHaveSource, 'У каждой подписи должна быть ссылка на источник');
        assert.ok(creditStats.allCommonsHaveLicense, 'У каждого фото Commons должна быть ссылка на точную лицензию');
        assert.ok(creditStats.allOpenSafely, 'Ссылки атрибуции должны безопасно открываться в новой вкладке');
        const firstCreditLink = page.locator('.uni-image-credit [data-credit-source]').first();
        if (await firstCreditLink.count()) {
            await firstCreditLink.evaluate(link => {
                link.addEventListener('click', event => event.preventDefault(), { once: true });
                link.click();
            });
            assert.equal(await page.locator('#uni-modal').evaluate(el => el.style.display || 'none'), 'none',
                'Клик по источнику изображения не должен открывать карточку вуза');
        }

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
                    controlsLeft: Math.round(controls.left),
                    controlsRight: Math.round(controls.right),
                    mobileButtons: [...document.querySelectorAll('.theme-switch, .edu-level-indicator, .mobile-menu-toggle')].map(button => {
                        const r = button.getBoundingClientRect();
                        return { width: Math.round(r.width), height: Math.round(r.height) };
                    }),
                    navDisplay: getComputedStyle(nav).display,
                    menuVisible: getComputedStyle(menuButton).display !== 'none'
                };
            });
            layoutReport.push(metrics);
            assert.ok(metrics.document <= width + 1, 'Горизонтальная прокрутка документа при ширине ' + width + 'px: ' + metrics.document + 'px');
            assert.ok(metrics.body <= width + 1, 'Горизонтальная прокрутка body при ширине ' + width + 'px: ' + metrics.body + 'px');
            assert.ok(metrics.headerRight <= width + 1, 'Шапка выходит за экран при ширине ' + width + 'px');
            assert.ok(metrics.logoRight <= metrics.controlsLeft, 'Логотип пересекается с кнопками шапки при ширине ' + width + 'px');
            if (width <= 820) {
                assert.ok(metrics.mobileButtons.every(button => button.width >= 44 && button.height >= 44),
                    'Кнопки в шапке меньше 44px при ширине ' + width + 'px');
            }
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
        const menuButtonDebug = await menuButton.evaluate(button => ({
            html: button.outerHTML,
            display: getComputedStyle(button).display,
            rect: (() => { const r = button.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
            inHeader: Boolean(button.closest('header')),
        }));
        await menuButton.click();
        assert.equal(await menuButton.getAttribute('aria-expanded'), 'true',
            'Мобильное меню не открылось. Кнопка: ' + JSON.stringify(menuButtonDebug) + '; ошибки: ' + pageErrors.join('; '));
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

        await page.locator('.recommendations-btn').first().click();
        assert.equal(await page.locator('#recommendations-modal').evaluate(el => el.style.display), 'block', 'Кнопка рекомендаций не открывает окно');
        assert.ok(await page.locator('#skills-list .skill-tag').count() > 0, 'Окно рекомендаций не заполнено');
        await page.locator('#recommendations-modal .close').click();

        await page.locator('.show-unis-for-profession-btn').first().click();
        assert.ok(await page.locator('#reset-uni-filter-btn').isVisible(), 'Кнопка «Показать вузы» не применила подбор');
        await page.locator('#reset-uni-filter-btn').click();
        assert.ok(await page.locator('.uni-card').count() > 0, 'Сброс фильтра вузов не восстановил каталог');

        const uniFilterOptions = await page.locator('#uni-filter option').evaluateAll(options => options.map(option => option.value));
        if (uniFilterOptions.length > 1) {
            await page.locator('#uni-filter').selectOption(uniFilterOptions[1]);
            assert.ok(await page.locator('#reset-uni-filter-btn').isVisible(), 'Фильтр направлений вузов не активировал сброс');
            await page.locator('#reset-uni-filter-btn').click();
        }

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
        await page.locator('#add-to-favorites-btn').click();
        assert.equal(await page.locator('#auth-modal').evaluate(el => el.style.display), 'block', 'Кнопка избранного не предлагает авторизацию');
        await page.locator('#auth-modal .close').click();
        await page.locator('#uni-modal .close').click();

        await page.locator('#mobile-menu-toggle').click();
        await page.locator('#primary-navigation #login-btn').click();
        assert.equal(await page.locator('#auth-modal').evaluate(el => el.style.display), 'block', 'Кнопка входа не открывает форму авторизации');
        await page.locator('#auth-modal .close').click();

        await page.locator('#universities').scrollIntoViewIfNeeded();
        while (await page.locator('#show-more-universities-btn').isVisible()) {
            await page.locator('#show-more-universities-btn').click();
        }
        for (const name of ['МФЭИ', 'МГИ им. Дашковой', 'МГЭИ', 'МГАХ им. Сурикова (филиал)']) {
            assert.equal(await page.locator('.uni-card[data-uni-name="' + name + '"]').count(), 0,
                'Архивная или дублирующая запись не должна попадать в активный каталог: ' + name);
        }
        for (const name of ['МГТА', 'МАБИВ']) {
            const card = page.locator('.uni-card[data-uni-name="' + name + '"]');
            assert.equal(await card.count(), 1, 'Запись на проверке должна сохраняться: ' + name);
            assert.ok(await card.locator('.uni-review-badge').count() > 0,
                'Запись должна иметь видимую отметку о проверке: ' + name);
            assert.ok(await card.locator('.uni-image-missing').count() > 0,
                'Для неподтверждённой фотографии должен показываться placeholder: ' + name);
        }
        const inekbiCard = page.locator('.uni-card[data-uni-name="ИНЭКБИ"]');
        assert.equal(await inekbiCard.count(), 1, 'Действующая организация ИНЭКБИ должна оставаться в каталоге');
        assert.ok(await inekbiCard.locator('.uni-image-missing').count() > 0,
            'При отсутствии точного фото нельзя показывать постороннюю стоковую фотографию');
        const mipCard = page.locator('.uni-card[data-uni-name="МИП"]');
        assert.ok(await mipCard.locator('.uni-image-credit[data-credit-type="official"]').count() > 0,
            'Для фото МИП должна отображаться ссылка на официальный источник');
        await page.locator('.uni-card[data-uni-name="МГТА"] .uni-content').click();
        assert.ok(await page.locator('#uni-info .uni-status-note').isVisible(),
            'Подробности организации должны содержать пояснение о статусе');
        await page.locator('#uni-modal .close').click();

        const screenshotDir = path.join(root, 'artifacts');
        fs.mkdirSync(screenshotDir, { recursive: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => {
            document.documentElement.style.scrollBehavior = 'auto';
            document.body.style.scrollBehavior = 'auto';
            window.scrollTo(0, 0);
            document.getElementById('toast')?.classList.remove('show');
        });
        await page.waitForFunction(() => window.scrollY === 0);
        const eduBannerLayout = await page.locator('#edu-level-banner').evaluate(el => ({
            children: [...el.children].map(child => child.className || child.tagName.toLowerCase()),
            text: el.querySelector('.edu-level-banner-copy')?.innerText || ''
        }));
        assert.deepEqual(eduBannerLayout.children, ['edu-level-banner-copy', 'button'],
            'Подпись уровня и кнопка изменения должны быть двумя ровными блоками');
        assert.ok(eduBannerLayout.text.includes('Вы выбрали уровень'), 'В плашке уровня должен отображаться выбранный уровень');

        const mobileHeader = await page.evaluate(() => {
            const header = document.querySelector('header').getBoundingClientRect();
            const logo = document.querySelector('.logo-svg').getBoundingClientRect();
            return {
                top: Math.round(header.top),
                height: Math.round(header.height),
                background: getComputedStyle(document.querySelector('header')).backgroundColor,
                visibility: getComputedStyle(document.querySelector('header')).visibility,
                opacity: getComputedStyle(document.querySelector('header')).opacity,
                logoRect: { x: Math.round(logo.x), y: Math.round(logo.y), width: Math.round(logo.width), height: Math.round(logo.height) },
                logoVisible: logo.width > 0 && logo.height > 0 && logo.top >= 0 && logo.bottom <= header.bottom + 1
            };
        });
        assert.ok(mobileHeader.top === 0 && mobileHeader.height >= 48 && mobileHeader.logoVisible, 'Шапка и логотип должны быть видны в начале мобильной страницы: ' + JSON.stringify(mobileHeader));
        assert.equal(mobileHeader.visibility, 'visible', 'Шапка не должна быть скрыта на мобильном устройстве');
        assert.notEqual(mobileHeader.opacity, '0', 'Шапка не должна быть прозрачной на мобильном устройстве');
        await page.screenshot({ path: path.join(screenshotDir, 'mobile-390.png'), fullPage: false });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.evaluate(() => {
            document.documentElement.style.scrollBehavior = 'auto';
            document.body.style.scrollBehavior = 'auto';
            window.scrollTo(0, 0);
            document.getElementById('toast')?.classList.remove('show');
        });
        await page.waitForFunction(() => window.scrollY === 0);
        const desktopLogoVisible = await page.locator('.logo-svg').isVisible();
        assert.ok(desktopLogoVisible, 'Логотип должен быть виден в начале десктопной страницы');
        await page.screenshot({ path: path.join(screenshotDir, 'desktop-1440.png'), fullPage: false });

        assert.deepEqual(pageErrors, [], 'Ошибки JavaScript в браузере: ' + pageErrors.join('; '));

        await page.waitForFunction(() => window.__authObserverRegistered === true, null, { timeout: 5000 });
        await page.evaluate(() => window.__setTestAuthUser({ uid: 'test-profile-user' }));
        await page.waitForFunction(() => window.__firestoreLoadCount === 1, null, { timeout: 5000 });
        await page.waitForFunction(() =>
            document.querySelector('#saved-results')?.textContent.includes('Вы еще не сохраняли результаты теста.')
            && document.querySelector('#favorites')?.textContent.includes('Вы еще не добавляли учебные заведения в избранное.')
        );
        const lazyFirestoreState = await page.evaluate(() => ({
            sdkAvailable: typeof window.firebase.firestore === 'function',
            loadCount: window.__firestoreLoadCount
        }));
        assert.deepEqual(lazyFirestoreState, { sdkAvailable: true, loadCount: 1 },
            'Firestore должен загружаться один раз при первом обращении к данным профиля');
        assert.deepEqual(pageErrors, [], 'Ошибки JavaScript после загрузки Firestore: ' + pageErrors.join('; '));

        console.log(JSON.stringify({
            result: 'PASS',
            testedViewports: layoutReport,
            flows: [
                'mobile navigation open/close and anchor routing',
                'theme switch',
                '12-question Holland test submission',
                'profession search, type filter, recommendations and pagination',
                'profession-to-university selection and filter reset',
                'university filter, pagination, compare selection, comparison modal and details modal',
                'favorite action prompts authentication and preserves the university modal',
                'login modal open/close',
                'Firestore remains unloaded for guests and loads once after authentication'
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