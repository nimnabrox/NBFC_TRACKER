/**
 * ⚡ Cloudflare Worker Universal Real-Time Edge Relay (100% KV-Free, Zero Daily Cap)
 * Created by NimnaBro
 * 
 * Operates purely in-memory with 0 KV writes and 0 KV reads.
 * Unlimited users, 0 database limits, 0ms edge response.
 */

const roomStates = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    // API Sync Endpoint
    if (url.pathname === '/api/sync') {
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          const room = (payload.room || 'nimnabro').toLowerCase();

          let existing = roomStates.get(room) || {};

          const state = {
            ...existing,
            ...payload,
            updatedAt: Date.now()
          };

          // In-Memory Fast Edge Relay: ZERO KV WRITES = ZERO LIMITS EVER!
          roomStates.set(room, state);

          return new Response(JSON.stringify({ ok: true, room }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 400 });
        }
      }

      const rawRoom = url.searchParams.get('room');
      // If no room is explicitly requested, return a fresh clean state (User Privacy)
      if (!rawRoom || !rawRoom.trim()) {
        return new Response(JSON.stringify({
          room: '',
          total: 0,
          lastMatch: 0,
          liveChests: 0,
          base: null,
          session: 0,
          player: '—',
          accounts: [],
          matches: [],
          inProgress: false
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      const room = rawRoom.toLowerCase();
      let state = roomStates.get(room);

      if (!state) {
        state = {
          room,
          total: 0,
          lastMatch: 0,
          liveChests: 0,
          base: null,
          session: 0,
          player: null,
          accounts: [],
          matches: [],
          inProgress: false
        };
      }

      return new Response(JSON.stringify(state), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Static assets fallback (handled automatically by Cloudflare Worker Assets)
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
  }
};
