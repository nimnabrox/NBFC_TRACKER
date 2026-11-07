/**
 * ⚡ Cloudflare Worker Universal Handler with Global KV Edge Storage
 * Created by NimnaBro
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
          const kvKey = `fct_room_${room}`;

          let existing = roomStates.get(room) || {};
          if (env.TRACKER_KV) {
            try {
              const raw = await env.TRACKER_KV.get(kvKey, 'json');
              if (raw) existing = { ...existing, ...raw };
            } catch {}
          }

          const state = {
            ...existing,
            ...payload,
            updatedAt: Date.now()
          };

          roomStates.set(room, state);

          if (env.TRACKER_KV) {
            try {
              await env.TRACKER_KV.put(kvKey, JSON.stringify(state));
            } catch {}
          }

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

      const room = (url.searchParams.get('room') || 'nimnabro').toLowerCase();
      const kvKey = `fct_room_${room}`;

      let state = roomStates.get(room);
      if (!state && env.TRACKER_KV) {
        try {
          state = await env.TRACKER_KV.get(kvKey, 'json');
          if (state) roomStates.set(room, state);
        } catch {}
      }

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
