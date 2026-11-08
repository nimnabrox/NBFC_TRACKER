import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
test('saved layouts tolerate Cloudflare extensionless HTML redirects without looping', async () => {
  const script = await readFile('v3/public/appearance.js', 'utf8');
  const run = (href, saved) => {
    const url = new URL(href), redirects = [];
    runInNewContext(script, { URL, location: { href, pathname: url.pathname, port: url.port, hostname: url.hostname, replace: value => redirects.push(value) }, localStorage: { getItem: () => saved } });
    return redirects;
  };
  for (const path of ['/modern', '/modern.html', '/modern/']) assert.deepEqual(run('https://example.test'+path, 'modern'), []);
  for (const path of ['/', '/index.html', '/app', '/app.html']) {
    assert.deepEqual(run('https://example.test'+path, 'classic'), []);
    assert.equal(new URL(run('https://example.test'+path+'?room=alice&lang=ar', 'modern')[0]).pathname, '/modern.html');
  }
  assert.equal(new URL(run('https://example.test/modern?layout=classic&room=alice', 'modern')[0]).pathname, '/index.html');
  assert.equal(new URL(run('http://localhost:5088/modern.html?layout=classic', 'modern')[0]).pathname, '/app.html');
});
