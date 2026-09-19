/**
 * Anonymous, room-scoped Supabase transport.  This deliberately knows nothing
 * about a player's private board, notes, roles, or deductions.
 */
export type SharedGameState = {
  day: number;
  phase: "setup" | "day" | "nomination" | "night" | "finished";
  nominations: unknown[];
  deaths: unknown[];
  peacefulDays: number[];
  publicAnnouncements: unknown[];
  gameEvents: unknown[];
};

export type SharedRoom = {
  id: string;
  room_code: string;
  game_type: string;
  status: "waiting" | "active" | "finished" | "abandoned";
  game_state: SharedGameState;
  created_at: string;
  started_at: string | null;
  updated_at: string;
  finished_at: string | null;
  result: Record<string, unknown> | null;
  revision: number;
};

const url = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabaseReady = Boolean(url && key);
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
export const ROOM_CODE_PATTERN = /^[A-NP-Z1-9]{7}$/;

function headers(prefer?: string, roomCode?: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(roomCode ? { "X-Room-Code": roomCode } : {}),
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit, roomCode?: string): Promise<T> {
  if (!supabaseReady) throw new Error("SUPABASE_NOT_CONFIGURED");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(undefined, roomCode), ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return response.json() as Promise<T>;
}

export function normaliseRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z1-9]/g, "").replace(/[O0]/g, "").slice(0, 7);
}

export function createRoomCode() {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

export async function findRoom(code: string): Promise<SharedRoom | null> {
  const roomCode = normaliseRoomCode(code);
  if (!ROOM_CODE_PATTERN.test(roomCode)) throw new Error("INVALID_ROOM_CODE");
  const rooms = await request<SharedRoom[]>(`game_rooms?select=*&room_code=eq.${encodeURIComponent(roomCode)}&limit=1`, undefined, roomCode);
  return rooms[0] || null;
}

export async function createRoom(gameType: string, state: SharedGameState): Promise<SharedRoom> {
  // A unique index is the final authority; collision retries are intentional.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const roomCode = createRoomCode();
    try {
      const created = await request<SharedRoom[]>("game_rooms", {
        method: "POST",
        headers: headers("return=representation"),
        body: JSON.stringify({
          room_code: roomCode,
          game_type: gameType,
          status: "waiting",
          game_state: state,
          revision: 0,
        }),
      });
      return created[0];
    } catch (error) {
      if (attempt === 5) throw error;
    }
  }
  throw new Error("ROOM_CREATE_FAILED");
}

export async function updateRoom(
  room: Pick<SharedRoom, "id" | "revision" | "room_code">,
  patch: Partial<Pick<SharedRoom, "game_state" | "status" | "result" | "started_at" | "finished_at">>,
): Promise<SharedRoom | null> {
  const updated = await request<SharedRoom[]>(`game_rooms?id=eq.${encodeURIComponent(room.id)}&revision=eq.${room.revision}`, {
    method: "PATCH",
    headers: headers("return=representation"),
    body: JSON.stringify({ ...patch, revision: room.revision + 1, updated_at: new Date().toISOString() }),
  }, room.room_code);
  return updated[0] || null;
}

export function subscribeRoom(room: Pick<SharedRoom, "id" | "room_code" | "revision">, onChange: (room: SharedRoom) => void) {
  if (!supabaseReady) return () => undefined;
  const roomId = room.id;
  const socket = new WebSocket(`${url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`);
  let heartbeat: number | undefined;
  let newestRevision = room.revision;
  let disposed = false;
  const deliver = (next: SharedRoom) => {
    if (next.id === roomId && next.revision > newestRevision) {
      newestRevision = next.revision;
      onChange(next);
    }
  };
  socket.onopen = () => {
    socket.send(JSON.stringify({ topic: `realtime:public:game_rooms:id=eq.${roomId}`, event: "phx_join", payload: { config: { broadcast: { self: false }, postgres_changes: [{ event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` }] } }, ref: "1" }));
    heartbeat = window.setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) })), 25000);
  };
  socket.onmessage = (message) => {
    try {
      const payload = JSON.parse(message.data);
      const room = payload?.payload?.data?.record as SharedRoom | undefined;
      if (room?.id === roomId) deliver(room);
    } catch { /* ignore malformed realtime events */ }
  };
  // Realtime row filters cannot carry the per-request X-Room-Code header used
  // by our anti-enumeration RLS policy. A small exact-code poll is therefore
  // retained as a secure recovery path and guarantees convergence after sleep,
  // offline periods, or a dropped websocket.
  const refresh = async () => {
    if (disposed || !navigator.onLine) return;
    try { const latest = await findRoom(room.room_code); if (latest) deliver(latest); } catch { /* next interval retries */ }
  };
  const poll = window.setInterval(refresh, 2500);
  window.addEventListener("online", refresh);
  return () => {
    disposed = true;
    if (heartbeat) window.clearInterval(heartbeat);
    window.clearInterval(poll);
    window.removeEventListener("online", refresh);
    socket.close();
  };
}

export type RecentRoom = { roomCode: string; gameType: string; lastAccessedAt: string; summary: string };
const recentKey = "clocktower-recent-shared-rooms";
export function readRecentRooms(): RecentRoom[] {
  try { return JSON.parse(localStorage.getItem(recentKey) || "[]"); } catch { return []; }
}
export function rememberRoom(room: Pick<SharedRoom, "room_code" | "game_type" | "game_state" | "status" | "result">) {
  const summary = room.status === "finished" ? "游戏结束" : `第 ${room.game_state.day} 天 · 已死亡 ${room.game_state.deaths.length} 人`;
  const item: RecentRoom = { roomCode: room.room_code, gameType: room.game_type, lastAccessedAt: new Date().toISOString(), summary };
  localStorage.setItem(recentKey, JSON.stringify([item, ...readRecentRooms().filter((recent) => recent.roomCode !== item.roomCode)].slice(0, 12)));
}
