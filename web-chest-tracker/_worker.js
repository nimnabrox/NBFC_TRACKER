/**
 * ⚡ Cloudflare Worker Universal Handler with Global KV Edge Storage
 * Created by NimnaBro
 */

const roomStates = new Map();
const roomLastKvWrite = new Map();

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

          const state = {
            ...existing,
            ...payload,
            updatedAt: Date.now()
          };

          // 1. Worker In-Memory Cache is primary (0ms latency, zero KV operations)
          roomStates.set(room, state);

          // 2. Ultra-conservative KV write: only if values changed AND throttled to once every 5 minutes
          const lastWrite = roomLastKvWrite.get(room) || 0;
          const hasChanged = !existing ||
            existing.total !== payload.total ||
            existing.session !== payload.session ||
            existing.lastMatch !== payload.lastMatch ||
            existing.player !== payload.player ||
            (payload.matches && payload.matches.length !== (existing.matches ? existing.matches.length : 0));

          if (hasChanged && (Date.now() - lastWrite > 300000) && env.TRACKER_KV) {
            roomLastKvWrite.set(room, Date.now());
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

      const rawRoom = url.searchParams.get('room');
      // If no room is explicitly requested, return a fresh clean state (User Privacy: never leak nimnabro's data to random visitors)
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
      const kvKey = `fct_room_${room}`;

      // 1. In-memory check first (0 KV reads!)
      let state = roomStates.get(room);

      // 2. Only on cold start, query KV once
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
