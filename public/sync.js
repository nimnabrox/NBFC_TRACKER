/**
 * ⚡ NimnaBro's Multi-Channel Real-Time Sync Engine
 * Created by NimnaBro
 * 
 * Synchronizes live chest stats between the Web Dashboard and OBS Studio Browser Source.
 * Supports:
 *   1. BroadcastChannel API (Zero-latency same-machine cross-tab sync)
 *   2. LocalStorage Event (Cross-window persistence)
 *   3. Cloudflare Pages Function API (/api/sync)
 *   4. WebRTC Peer-to-Peer DataChannel (Dual-PC and remote streaming with 0 server cost)
 */

export class SyncManager {
  constructor(room = "nimnabro", isOverlay = false) {
    this.room = room.toLowerCase().trim();
    this.isOverlay = isOverlay;
    this.callbacks = [];
    this.peer = null;
    this.peerConnection = null;
    this.broadcastChannel = null;
    this.pollInterval = null;

    this.initBroadcastChannel();
    this.initLocalStorage();
  }

  // --- 1. BroadcastChannel (Same PC instant 0ms sync) ---
  initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        this.broadcastChannel = new BroadcastChannel("nb_chest_sync_" + this.room);
        if (this.isOverlay) {
          this.broadcastChannel.onmessage = (event) => {
            if (event.data) {
              this.dispatch(event.data);
            }
          };
        }
      }
    } catch (e) {
      console.warn("[Sync] BroadcastChannel not available:", e);
    }
  }

  // --- 2. LocalStorage Event (Fallback same PC) ---
  initLocalStorage() {
    if (this.isOverlay) {
      window.addEventListener("storage", (e) => {
        if (e.key === "nb_chest_state_" + this.room && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.dispatch(data);
          } catch {}
        }
      });

      // Read initial state from localStorage if available
      try {
        const cached = localStorage.getItem("nb_chest_state_" + this.room);
        if (cached) {
          this.dispatch(JSON.parse(cached));
        }
      } catch {}
    }
  }

  // --- 3. Cloudflare Pages / Worker Sync (/api/sync) ---
  startCloudSync(intervalMs = 1000) {
    if (this.isOverlay) {
      // Overlay polls /api/sync
      this.pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/sync?room=${encodeURIComponent(this.room)}`, {
            cache: "no-store"
          });
          if (res.ok) {
            const data = await res.json();
            this.dispatch(data);
          }
        } catch {}
      }, intervalMs);
    }
  }

  // --- 4. WebRTC PeerJS Sync (Dual PC / Remote) ---
  initPeerSync(peerLib) {
    if (!peerLib) return;
    try {
      const peerId = this.isOverlay ? undefined : `nb-chest-host-${this.room}`;
      this.peer = new peerLib(peerId, { debug: 0 });

      if (this.isOverlay) {
        // Overlay connects to host
        this.peer.on("open", () => {
          this.connectToHost();
        });
      } else {
        // Dashboard accepts incoming overlay connections
        this.peer.on("connection", (conn) => {
          this.peerConnection = conn;
          conn.on("open", () => {
            // Send current state immediately on connection
            const current = this.getLastBroadcasted();
            if (current) conn.send(current);
          });
        });
      }
    } catch (err) {
      console.warn("[Sync] WebRTC init failed:", err);
    }
  }

  connectToHost() {
    if (!this.peer) return;
    const conn = this.peer.connect(`nb-chest-host-${this.room}`);
    conn.on("data", (data) => {
      this.dispatch(data);
    });
    conn.on("close", () => {
      // Reconnect after delay
      setTimeout(() => this.connectToHost(), 3000);
    });
  }

  // --- Broadcast State from Dashboard ---
  broadcast(state) {
    const payload = {
      room: this.room,
      ...state,
      timestamp: Date.now()
    };

    this._lastState = payload;

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(payload); } catch {}
    }

    // 2. LocalStorage
    try {
      localStorage.setItem("nb_chest_state_" + this.room, JSON.stringify(payload));
    } catch {}

    // 3. WebRTC Peer
    if (this.peerConnection && this.peerConnection.open) {
      try { this.peerConnection.send(payload); } catch {}
    }

    // 4. Cloudflare /api/sync POST
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {}
  }

  getLastBroadcasted() {
    return this._lastState || null;
  }

  // --- Register Listeners on Overlay ---
  onUpdate(callback) {
    this.callbacks.push(callback);
  }

  dispatch(data) {
    for (const cb of this.callbacks) {
      try { cb(data); } catch (e) { console.error(e); }
    }
  }

  destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.broadcastChannel) this.broadcastChannel.close();
    if (this.peer) this.peer.destroy();
  }
}
