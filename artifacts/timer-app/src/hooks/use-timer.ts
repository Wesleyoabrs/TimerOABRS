import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type TimerMode = "countdown" | "countup";

export interface TimerState {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  blocked: boolean;
}

const socket: Socket = io({
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

export function useTimer(roomId: string) {
  const [state, setState] = useState<TimerState>({
    roomId,
    totalSeconds: 0,
    currentSeconds: 0,
    running: false,
    mode: "countdown",
    blocked: false,
  });
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      socket.emit("room:join", roomId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onTimerState(newState: TimerState) {
      if (newState.roomId === roomId) {
        setState(newState);
      }
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("timer:state", onTimerState);

    if (socket.connected) {
      socket.emit("room:join", roomId);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("timer:state", onTimerState);
    };
  }, [roomId]);

  const setTimer = useCallback((seconds: number, mode: TimerMode) => {
    socket.emit("timer:set", { roomId, seconds, mode });
  }, [roomId]);

  const resetTimer = useCallback(() => {
    socket.emit("timer:reset", { roomId });
  }, [roomId]);

  const setMode = useCallback((mode: TimerMode) => {
    socket.emit("timer:mode", { roomId, mode });
  }, [roomId]);

  return { state, isConnected, setTimer, resetTimer, setMode };
}
