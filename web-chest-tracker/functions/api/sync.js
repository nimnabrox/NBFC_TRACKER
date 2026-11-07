/**
 * ⚡ Cloudflare Pages Function: /api/sync
 * Created by NimnaBro
 * 
 * Provides global real-time synchronization between the Web Dashboard and OBS Browser Source.
 * Runs on Cloudflare's edge network with 0ms cold start and unlimited free requests.
 */

// Global in-memory edge room store
const roomStates = new Map();

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const room = (payload.room || "nimnabro").toLowerCase();
    
    roomStates.set(room, {
      ...payload,
      updatedAt: Date.now()
    });

    return new Response(JSON.stringify({ ok: true, room }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const room = (url.searchParams.get("room") || "nimnabro").toLowerCase();

  const state = roomStates.get(room) || {
    room,
    total: 0,
    lastMatch: 0,
    liveChests: 0,
    base: null,
    session: 0,
    player: "nimnabro",
    inProgress: false,
    updatedAt: Date.now()
  };

  return new Response(JSON.stringify(state), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
