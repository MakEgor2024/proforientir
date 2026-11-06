const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML has unique IDs and every static script ID reference exists', () => {
  const html = read('index.html');
  const script = read('script.js');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML contains duplicate IDs');

  const idSet = new Set(ids);
  const referenced = [...script.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)]
    .map((match) => match[1])
    .filter((id) => id !== 'edu-level-banner-switch');
  const missing = [...new Set(referenced.filter((id) => !idSet.has(id)))];
  assert.deepEqual(missing, [], 'script.js references missing HTML IDs');
});

test('profession and university catalogues contain valid core records', () => {
  const professions = JSON.parse(read('professions.json'));
  const universities = JSON.parse(read('universities.json'));
  assert.ok(professions.length >= 1);
  assert.ok(universities.length >= 1);

  for (const profession of professions) {
    assert.ok(profession.name && profession.description, 'profession needs a name and description');
    assert.ok(Array.isArray(profession.types) && profession.types.length, `invalid Holland types: ${profession.name}`);
  }
  for (const university of universities) {
    assert.ok(university.name && university.info, 'university needs a name and description');
    assert.ok(Array.isArray(university.programs), `university programmes must be an array: ${university.name}`);
    if (university.catalogStatus === 'closed') continue;
    if (!university.imageUrl) {
      assert.ok(university.imageStatusNote,
        `university without image must have an explanation: ${university.name}`);
    } else {
      assert.match(university.imageUrl, /^https?:\/\//, `university image must use HTTP(S): ${university.name}`);
    }
  }
});

test('key user actions remain wired to event handlers', () => {
  const script = read('script.js');
  for (const token of [
    "startTestBtn.addEventListener('click'",
    "careerTestForm.addEventListener('submit', handleTestSubmit)",
    "saveResultBtn.addEventListener('click'",
    "showMoreUniversitiesBtn.addEventListener('click'",
    "compareUnisBtn.addEventListener('click'",
    "addToFavoritesBtn.addEventListener('click'",
    "clearProfileBtn.addEventListener('click'"
  ]) assert.ok(script.includes(token), `missing handler: ${token}`);
  assert.ok(script.includes('data-profile-action="remove-result"'));
  assert.ok(script.includes('data-profile-action="remove-favorite"'));
});

test('legacy commented-out profession catalogue was removed', () => {
  const script = read('script.js');
  assert.ok(!script.includes('/*const professions = ['));
});

test('service worker cache contains only local application assets', () => {
  const sw = read('sw.js');
  assert.match(sw, /proforientir-4/);
  assert.ok(!sw.includes('fonts.googleapis.com'));
  assert.ok(!sw.includes('cdn.jsdelivr.net'));
});


test('Firestore SDK is loaded only when profile data is needed', () => {
  const html = read('index.html');
  const script = read('script.js');
  assert.ok(!html.includes('firebase-firestore-compat.js'),
    'Firestore must not be part of the initial HTML payload');
  assert.ok(script.includes('async function ensureFirestore()'),
    'profile operations must use the lazy Firestore loader');
  assert.ok(script.includes('FIRESTORE_SDK_URL'),
    'lazy loader must define the Firestore SDK URL');
});


test('the education selector can render before app JavaScript initializes', () => {
  const html = read('index.html');
  const css = read('style.css');
  assert.ok(html.indexOf("localStorage.getItem('proforientirEduLevel')") < html.indexOf('rel="stylesheet"'),
    'saved education level must be detected before loading styles');
  assert.ok(css.includes('html:not(.edu-level-selected) #edu-level-modal'),
    'the initial education selector must not depend on JavaScript');
});


test('profession filter and interactive university cards have accessible names', () => {
  const html = read('index.html');
  const script = read('script.js');
  assert.match(html, /id="profession-type-filter"[^>]*aria-label=/);
  assert.ok(script.includes('role="button" tabindex="0"'));
  assert.ok(!script.includes('aria-label="Подробнее об организации:'));
  assert.ok(script.includes('<h3>${safeName}</h3>'));
  assert.ok(script.includes('<h3>${highlightText(sanitizeHTML(prof.name), searchTerm)}</h3>'));
});

test('image licence links have a minimum touch target size', () => {
  const css = read('style.css');
  assert.match(css, /\.uni-image-credit a[\s\S]*?min-width:\s*24px[\s\S]*?min-height:\s*24px/);
});


test('Firebase Auth SDK is requested lazily rather than blocking the initial page', () => {
  const html = read('index.html');
  const script = read('script.js');
  assert.ok(!html.includes('firebase-auth-compat.js'),
    'Firebase Auth must not be downloaded with the initial HTML');
  assert.ok(script.includes('const FIREBASE_AUTH_SDK_URL'),
    'the lazy Auth loader must define the SDK URL');
  assert.ok(script.includes('script.src = FIREBASE_AUTH_SDK_URL'),
    'the Auth SDK must be injected only when required');
  assert.ok(script.includes('window.setTimeout(initializeAuthStateListener, 3500)'),
    'session restoration must wait until after initial rendering');
  assert.ok(script.includes("document.addEventListener('pointerdown', initializeAuthStateListener"),
    'user interaction must start session restoration immediately');
});
