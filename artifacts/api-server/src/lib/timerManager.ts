import { Server, Socket } from "socket.io";
import { logger } from "./logger";

export type TimerMode = "countdown" | "countup";

export interface RoomState {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  blocked: boolean;
  customName: string;
  intervalHandle: ReturnType<typeof setInterval> | null;
}

export interface RoomPayload {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  blocked: boolean;
  customName: string;
}

export interface ViewerStatus {
  roomId: string;
  blocked: boolean;
  customName: string;
}

const TOTAL_ROOMS = 14;
const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      totalSeconds: 0,
      currentSeconds: 0,
      running: false,
      mode: "countdown",
      blocked: false,
      customName: "",
      intervalHandle: null,
    });
  }
  return rooms.get(roomId)!;
}

function stopInterval(state: RoomState) {
  if (state.intervalHandle !== null) {
    clearInterval(state.intervalHandle);
    state.intervalHandle = null;
  }
}

function toPayload(state: RoomState): RoomPayload {
  return {
    roomId: state.roomId,
    totalSeconds: state.totalSeconds,
    currentSeconds: state.currentSeconds,
    running: state.running,
    mode: state.mode,
    blocked: state.blocked,
    customName: state.customName,
  };
}

function toViewerStatus(state: RoomState): ViewerStatus {
  return { roomId: state.roomId, blocked: state.blocked, customName: state.customName };
}

function broadcastState(io: Server, roomId: string, state: RoomState) {
  const payload = toPayload(state);
  io.to(`room-${roomId}`).emit("timer:state", payload);
  io.to("superadmin").emit("superadmin:room_update", payload);
  io.to("viewer").emit("viewer:room_status", toViewerStatus(state));
}

function startTicking(io: Server, state: RoomState) {
  stopInterval(state);
  state.running = true;

  state.intervalHandle = setInterval(() => {
    if (state.mode === "countdown") {
      if (state.currentSeconds <= 0) {
        state.currentSeconds = 0;
        state.running = false;
        stopInterval(state);
        broadcastState(io, state.roomId, state);
        return;
      }
      state.currentSeconds -= 1;
    } else {
      state.currentSeconds += 1;
    }
    broadcastState(io, state.roomId, state);
  }, 1000);
}

function getAllPayloads(): RoomPayload[] {
  return Array.from(rooms.values()).map(toPayload);
}

function initAllRooms() {
  for (let i = 1; i <= TOTAL_ROOMS; i++) {
    getOrCreateRoom(String(i));
  }
}

export function setupTimerSocket(io: Server) {
  initAllRooms();

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // --- Home page viewer ---
    socket.on("viewer:join", () => {
      socket.join("viewer");
      const statuses = Array.from(rooms.values()).map(toViewerStatus);
      socket.emit("viewer:all_statuses", statuses);
    });

    // --- Regular room client ---
    socket.on("room:join", (roomId: string) => {
      socket.join(`room-${roomId}`);
      const state = getOrCreateRoom(roomId);
      socket.emit("timer:state", toPayload(state));
      logger.info({ socketId: socket.id, roomId }, "Joined room");
    });

    socket.on("timer:set", (data: { roomId: string; seconds: number; mode: TimerMode }) => {
      const state = getOrCreateRoom(data.roomId);
      if (state.blocked) return;
      stopInterval(state);
      state.mode = data.mode;
      state.totalSeconds = data.seconds;
      state.currentSeconds = data.mode === "countdown" ? data.seconds : 0;
      state.running = true;
      startTicking(io, state);
      broadcastState(io, data.roomId, state);
      logger.info(data, "Timer set and started");
    });

    socket.on("timer:reset", (data: { roomId: string }) => {
      const state = getOrCreateRoom(data.roomId);
      stopInterval(state);
      state.running = false;
      state.currentSeconds = state.mode === "countdown" ? state.totalSeconds : 0;
      broadcastState(io, data.roomId, state);
      logger.info({ roomId: data.roomId }, "Timer reset");
    });

    socket.on("timer:mode", (data: { roomId: string; mode: TimerMode }) => {
      const state = getOrCreateRoom(data.roomId);
      stopInterval(state);
      state.running = false;
      state.mode = data.mode;
      state.currentSeconds = data.mode === "countdown" ? state.totalSeconds : 0;
      broadcastState(io, data.roomId, state);
      logger.info(data, "Timer mode changed");
    });

    // --- Superadmin ---
    socket.on("superadmin:join", () => {
      socket.join("superadmin");
      socket.emit("superadmin:all_states", getAllPayloads());
      logger.info({ socketId: socket.id }, "Superadmin joined");
    });

    socket.on("superadmin:block", (data: { roomId: string; blocked: boolean }) => {
      const state = getOrCreateRoom(data.roomId);
      state.blocked = data.blocked;
      if (data.blocked && state.running) {
        stopInterval(state);
        state.running = false;
      }
      broadcastState(io, data.roomId, state);
      logger.info(data, "Room block toggled");
    });

    socket.on("superadmin:set_name", (data: { roomId: string; name: string }) => {
      const state = getOrCreateRoom(data.roomId);
      state.customName = data.name.trim();
      broadcastState(io, data.roomId, state);
      logger.info(data, "Room name updated");
    });

    socket.on("superadmin:reset_room", (data: { roomId: string }) => {
      const state = getOrCreateRoom(data.roomId);
      stopInterval(state);
      state.running = false;
      state.currentSeconds = state.mode === "countdown" ? state.totalSeconds : 0;
      broadcastState(io, data.roomId, state);
      logger.info({ roomId: data.roomId }, "Room reset by superadmin");
    });

    socket.on("superadmin:reset_all", () => {
      rooms.forEach((state) => {
        stopInterval(state);
        state.running = false;
        state.currentSeconds = state.mode === "countdown" ? state.totalSeconds : 0;
        broadcastState(io, state.roomId, state);
      });
      logger.info("All rooms reset by superadmin");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });
}
