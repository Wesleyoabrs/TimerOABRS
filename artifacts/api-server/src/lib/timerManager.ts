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
  intervalHandle: ReturnType<typeof setInterval> | null;
}

export interface RoomPayload {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  blocked: boolean;
}

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
  };
}

function broadcastState(io: Server, roomId: string, state: RoomState) {
  const payload = toPayload(state);
  io.to(`room-${roomId}`).emit("timer:state", payload);
  // Also push update to superadmin watchers
  io.to("superadmin").emit("superadmin:room_update", payload);
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

export function setupTimerSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // --- Regular room client ---
    socket.on("room:join", (roomId: string) => {
      socket.join(`room-${roomId}`);
      const state = getOrCreateRoom(roomId);
      socket.emit("timer:state", toPayload(state));
      logger.info({ socketId: socket.id, roomId }, "Joined room");
    });

    socket.on("timer:set", (data: { roomId: string; seconds: number; mode: TimerMode }) => {
      const state = getOrCreateRoom(data.roomId);
      if (state.blocked) return; // blocked rooms ignore commands
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
      // Pre-create all 13 rooms so the superadmin always sees them
      for (let i = 1; i <= 13; i++) {
        getOrCreateRoom(String(i));
      }
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
