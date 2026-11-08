import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { TrackerRoom } from '../v3/web-cloud/_worker.js';
function environment() {
  const rooms = new Map();
  return { ROOMS: { idFromName: name => name, get: name => {
    if (!rooms.has(name)) {
      const data = new Map();
      rooms.set(name, new TrackerRoom({ storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, value) } }));
    }
    return rooms.get(name);
  } }, ASSETS: { fetch: async () => new Response('asset') } };
}
const post = value => new Request('https://test/api/sync', { method: 'POST', body: JSON.stringify(value) });
test('isolates normalized rooms, preserves reset to zero, and never supplies another player by default', async () => {
  const env = environment();
  assert.equal((await worker.fetch(post({ room: ' Alice ', total: 123 }), env)).status, 200);
  assert.equal((await (await worker.fetch(new Request('https://test/api/sync?room=alice'), env)).json()).total, 123);
  assert.equal((await (await worker.fetch(new Request('https://test/api/sync?room=bob'), env)).json()).total, 0);
  assert.equal((await (await worker.fetch(new Request('https://test/api/sync'), env)).json()).room, '');
  await worker.fetch(post({ room: 'alice', total: 0 }), env);
  assert.equal((await (await worker.fetch(new Request('https://test/api/sync?room=alice'), env)).json()).total, 0);
});
test('rejects malformed payloads, missing rooms, invalid counts, oversized snapshots, and methods', async () => {
  const env = environment();
  for (const body of [null, [], {}, { room: 'x', total: -1 }, { room: 'x', total: '5' }, { room: 'x', matches: {} }])
    assert.equal((await worker.fetch(post(body), env)).status, 400);
  assert.equal((await worker.fetch(post({ room: 'x', player: 'a'.repeat(524288) }), env)).status, 413);
  assert.equal((await worker.fetch(new Request('https://test/api/sync', { method: 'DELETE' }), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://test/api/sync', { method: 'OPTIONS' }), env)).status, 204);
  assert.equal(await (await worker.fetch(new Request('https://test/style.css'), env)).text(), 'asset');
});
