// One persistent object per room: readers in every region see the same snapshot.
const headers = {
  'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
};
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers });
export const emptyState = room => ({ room, total: 0, lastMatch: 0, liveChests: 0, base: null,
  session: 0, player: '', accounts: [], matches: [], inProgress: false });
export function roomName(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; }
export function validRoom(room) { return room.length > 0 && room.length <= 128 && !/[\u0000-\u001f\u007f]/.test(room); }
export class TrackerRoom {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    if (request.method === 'GET') return json(await this.ctx.storage.get('snapshot') || emptyState(''));
    const data = await request.json();
    await this.ctx.storage.put('snapshot', { ...emptyState(data.room), ...data, updatedAt: Date.now() });
    return json({ ok: true, room: data.room });
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/sync') return env.ASSETS.fetch(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    let data;
    if (request.method === 'POST') {
      if (Number(request.headers.get('Content-Length')) > 512 * 1024) return json({ error: 'Snapshot too large' }, 413);
      const body = await request.text();
      if (new TextEncoder().encode(body).byteLength > 512 * 1024) return json({ error: 'Snapshot too large' }, 413);
      try { data = JSON.parse(body); } catch { return json({ error: 'Invalid JSON' }, 400); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Invalid snapshot' }, 400);
      for (const key of ['total', 'lastMatch', 'liveChests', 'session']) {
        if (data[key] !== undefined && (!Number.isSafeInteger(data[key]) || data[key] < 0)) return json({ error: 'Invalid count' }, 400);
      }
      if (data.matches !== undefined && (!Array.isArray(data.matches) || data.matches.length > 150)) return json({ error: 'Invalid matches' }, 400);
      if (data.accounts !== undefined && !Array.isArray(data.accounts)) return json({ error: 'Invalid accounts' }, 400);
      const record = value => value && typeof value === 'object' && !Array.isArray(value);
      if (data.player !== undefined && typeof data.player !== 'string') return json({ error: 'Invalid player' }, 400);
      if (data.base != null && (!Number.isSafeInteger(data.base) || data.base < 0)) return json({ error: 'Invalid base' }, 400);
      if (data.matches?.some(m => !record(m) || ['playlist', 'playerName', 'matchStart'].some(k => m[k] != null && typeof m[k] !== 'string')
        || ['chestsOpened', 'placement', 'eliminations'].some(k => m[k] != null && (!Number.isSafeInteger(m[k]) || m[k] < 0)))) return json({ error: 'Invalid match record' }, 400);
      if (data.accounts?.some(a => !record(a) || ['name', 'key'].some(k => a[k] != null && typeof a[k] !== 'string'))) return json({ error: 'Invalid profile' }, 400);
    }
    const room = roomName(data?.room ?? url.searchParams.get('room'));
    if (!room && request.method === 'GET') return json(emptyState(''));
    if (!validRoom(room)) return json({ error: 'A room of 1–128 characters is required' }, 400);
    if (!env.ROOMS) return json({ error: 'Room storage is not configured' }, 503);
    const object = env.ROOMS.get(env.ROOMS.idFromName(room));
    return object.fetch(new Request('https://room/snapshot', request.method === 'POST'
      ? { method: 'POST', body: JSON.stringify({ ...data, room }) } : { method: 'GET' }));
  }
};
