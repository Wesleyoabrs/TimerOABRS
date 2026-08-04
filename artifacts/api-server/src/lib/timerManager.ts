import { Server, Socket } from "socket.io";
import { logger } from "./logger";

export type TimerMode = "countdown" | "countup";

export interface RoomState {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  intervalHandle: ReturnType<typeof setInterval> | null;
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

function broadcastState(io: Server, roomId: string, state: RoomState) {
  const payload = {
    roomId: state.roomId,
    totalSeconds: state.totalSeconds,
    currentSeconds: state.currentSeconds,
    running: state.running,
    mode: state.mode,
  };
  io.to(`room-${roomId}`).emit("timer:state", payload);
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

export function setupTimerSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("room:join", (roomId: string) => {
      socket.join(`room-${roomId}`);
      const state = getOrCreateRoom(roomId);
      // Send current state immediately
      socket.emit("timer:state", {
        roomId: state.roomId,
        totalSeconds: state.totalSeconds,
        currentSeconds: state.currentSeconds,
        running: state.running,
        mode: state.mode,
      });
      logger.info({ socketId: socket.id, roomId }, "Joined room");
    });

    socket.on("timer:set", (data: { roomId: string; seconds: number; mode: TimerMode }) => {
      const state = getOrCreateRoom(data.roomId);
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

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });
}
