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
  assert.match(sw, /proforientir-v3/);
  assert.ok(!sw.includes('fonts.googleapis.com'));
  assert.ok(!sw.includes('cdn.jsdelivr.net'));
});
