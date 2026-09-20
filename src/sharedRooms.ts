/** Anonymous, room-scoped Supabase transport for public Clocktower facts. */
export type SharedGameState = {
  day: number;
  phase: "setup" | "day" | "nomination" | "night" | "finished";
  nominations: unknown[];
  deaths: unknown[];
  peacefulDays: number[];
  publicAnnouncements: unknown[];
  gameEvents: unknown[];
  boardId?: string;
  composition?: Record<"镇民" | "外来者" | "爪牙" | "恶魔", number>;
  playerCount?: number;
};

export type SharedRoom = {
  id: string; room_code: string; room_name: string; game_type: string;
  status: "waiting" | "active" | "finished" | "abandoned";
  game_state: SharedGameState; created_at: string; started_at: string | null;
  updated_at: string; finished_at: string | null;
  result: { winner?: "good" | "evil"; [key: string]: unknown } | null;
  revision: number;
};

const url = (import.meta.env.VITE_SUPABASE_URL || "https://zsmzirwhyevrhvtiaxxk.supabase.co").replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbXppcndoeWV2cmh2dGlheHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDQ5ODUsImV4cCI6MjEwNTQyMDk4NX0.6thihwOfeiLHKATikEt86h3BDy9MA0Naqa9Vu-ocFtI";
export const supabaseReady = Boolean(url && key);
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
export const ROOM_CODE_PATTERN = /^[A-NP-Z1-9]{7}$/;

function headers(prefer?: string, roomCode?: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(roomCode ? { "X-Room-Code": roomCode } : {}), ...(prefer ? { Prefer: prefer } : {}) };
}
async function request<T>(path: string, init?: RequestInit, roomCode?: string): Promise<T> {
  if (!supabaseReady) throw new Error("SUPABASE_NOT_CONFIGURED");
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers(undefined, roomCode), ...(init?.headers || {}) } });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function normaliseRoomCode(value: string) { return value.toUpperCase().replace(/[^A-Z1-9]/g, "").replace(/[O0]/g, "").slice(0, 7); }
export function createRoomCode() {
  const bytes = new Uint8Array(7); crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}
export function truncateChars(value: string, maximum = 30) { return [...value].slice(0, maximum).join(""); }
export function makeRoomNamePrefix(boardName: string, now = new Date()) {
  const board = boardName.replace(/[（(].*?[）)]/g, "").replace(/局+$/, "").trim() || "未命名";
  return `${String(now.getFullYear()).slice(-2)}年${now.getMonth() + 1}月${now.getDate()} · ${board} · `;
}
export function makeDefaultRoomName(boardName: string, now = new Date(), suffix = "1") {
  const prefix = makeRoomNamePrefix(boardName, now);
  const available = Math.max(1, 30 - [...prefix].length);
  return `${prefix}${truncateChars(suffix.trim() || "1", available)}`;
}
export function makeRoomUrl(code: string) {
  const target = new URL(window.location.href); target.search = ""; target.searchParams.set("room", normaliseRoomCode(code)); target.hash = ""; return target.toString();
}

export async function findRoom(code: string): Promise<SharedRoom | null> {
  const roomCode = normaliseRoomCode(code);
  if (!ROOM_CODE_PATTERN.test(roomCode)) throw new Error("INVALID_ROOM_CODE");
  const rooms = await request<SharedRoom[]>(`game_rooms?select=*&room_code=eq.${encodeURIComponent(roomCode)}&limit=1`, undefined, roomCode);
  return rooms[0] || null;
}
export async function listRooms(): Promise<SharedRoom[]> {
  const rows = await request<SharedRoom[]>("rpc/list_shared_game_rooms", { method: "POST", body: "{}" });
  return rows.slice(0, 100);
}
export async function createRoom(gameType: string, state: SharedGameState, roomName = makeDefaultRoomName(gameType)): Promise<SharedRoom> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const roomCode = createRoomCode();
    try {
      const created = await request<SharedRoom[]>("game_rooms", { method: "POST", headers: headers("return=representation", roomCode), body: JSON.stringify({ room_code: roomCode, room_name: roomName, game_type: gameType, status: "waiting", game_state: state, revision: 0 }) }, roomCode);
      return created[0];
    } catch (error) { if (attempt === 5) throw error; }
  }
  throw new Error("ROOM_CREATE_FAILED");
}
export async function updateRoom(room: Pick<SharedRoom, "id" | "revision" | "room_code">, patch: Partial<Pick<SharedRoom, "room_name" | "game_state" | "status" | "result" | "started_at" | "finished_at">>): Promise<SharedRoom | null> {
  const updated = await request<SharedRoom[]>(`game_rooms?id=eq.${encodeURIComponent(room.id)}&revision=eq.${room.revision}`, { method: "PATCH", headers: headers("return=representation"), body: JSON.stringify({ ...patch, revision: room.revision + 1, updated_at: new Date().toISOString() }) }, room.room_code);
  return updated[0] || null;
}

export function subscribeRoom(room: Pick<SharedRoom, "id" | "room_code" | "revision">, onChange: (room: SharedRoom) => void, onPresence?: (count: number) => void) {
  if (!supabaseReady) return () => undefined;
  const roomId = room.id, presenceKey = crypto.randomUUID(), topic = `realtime:clocktower-room-${room.room_code}`;
  const socket = new WebSocket(`${url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`);
  let heartbeat: number | undefined, newestRevision = room.revision, disposed = false;
  let presenceState: Record<string, { metas?: unknown[] }> = {};
  const reportPresence = () => onPresence?.(Object.values(presenceState).reduce((sum, item) => sum + Math.max(1, item.metas?.length || 0), 0));
  const deliver = (next: SharedRoom) => { if (next.id === roomId && next.revision > newestRevision) { newestRevision = next.revision; onChange(next); } };
  socket.onopen = () => {
    socket.send(JSON.stringify({ topic, event: "phx_join", payload: { config: { broadcast: { self: false }, presence: { enabled: true, key: presenceKey }, postgres_changes: [{ event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` }] } }, ref: "1", join_ref: "1" }));
    heartbeat = window.setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) })), 25000);
  };
  socket.onmessage = (message) => {
    try {
      const data = JSON.parse(message.data);
      if (data.event === "phx_reply" && data.ref === "1" && data.payload?.status === "ok") socket.send(JSON.stringify({ topic, event: "presence", payload: { type: "presence", event: "track", payload: { online_at: new Date().toISOString() } }, ref: "2", join_ref: "1" }));
      if (data.event === "presence_state") { presenceState = data.payload || {}; reportPresence(); }
      if (data.event === "presence_diff") {
        for (const [id, value] of Object.entries(data.payload?.joins || {})) presenceState[id] = value as { metas?: unknown[] };
        for (const id of Object.keys(data.payload?.leaves || {})) delete presenceState[id];
        reportPresence();
      }
      const record = data?.payload?.data?.record as SharedRoom | undefined; if (record?.id === roomId) deliver(record);
    } catch { /* exact-code polling remains the recovery path */ }
  };
  const refresh = async () => { if (disposed || !navigator.onLine) return; try { const latest = await findRoom(room.room_code); if (latest) deliver(latest); } catch { /* retry */ } };
  const poll = window.setInterval(refresh, 1500); window.addEventListener("online", refresh);
  return () => {
    disposed = true; onPresence?.(0); if (heartbeat) window.clearInterval(heartbeat); window.clearInterval(poll); window.removeEventListener("online", refresh);
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ topic, event: "phx_leave", payload: {}, ref: "leave", join_ref: "1" })); socket.close();
  };
}

export type RecentRoom = { roomCode: string; roomName: string; gameType: string; lastAccessedAt: string; summary: string };
const recentKey = "clocktower-recent-shared-rooms";
export function readRecentRooms(): RecentRoom[] { try { return JSON.parse(localStorage.getItem(recentKey) || "[]").slice(0, 6); } catch { return []; } }
export function rememberRoom(room: Pick<SharedRoom, "room_code" | "room_name" | "game_type" | "game_state" | "status" | "result">) {
  const winner = room.result?.winner === "good" ? "善良方胜利" : room.result?.winner === "evil" ? "邪恶方胜利" : "游戏结束";
  const summary = room.status === "finished" ? `已结束 · ${winner}` : `进行到第 ${room.game_state.day} 天`;
  const item: RecentRoom = { roomCode: room.room_code, roomName: room.room_name, gameType: room.game_type, lastAccessedAt: new Date().toISOString(), summary };
  localStorage.setItem(recentKey, JSON.stringify([item, ...readRecentRooms().filter((recent) => recent.roomCode !== item.roomCode)].slice(0, 6)));
}
