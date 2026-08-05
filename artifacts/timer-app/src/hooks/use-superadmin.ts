import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { TimerMode } from "./use-timer";

export interface RoomPayload {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  running: boolean;
  mode: TimerMode;
  blocked: boolean;
}

// Dedicated socket for superadmin (same server, separate logical concern)
const saSocket: Socket = io({
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

export function useSuperAdmin() {
  const [roomStates, setRoomStates] = useState<Record<string, RoomPayload>>({});
  const [isConnected, setIsConnected] = useState(saSocket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      saSocket.emit("superadmin:join");
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onAllStates(states: RoomPayload[]) {
      const map: Record<string, RoomPayload> = {};
      states.forEach(s => { map[s.roomId] = s; });
      setRoomStates(map);
    }

    function onRoomUpdate(state: RoomPayload) {
      setRoomStates(prev => ({ ...prev, [state.roomId]: state }));
    }

    if (saSocket.connected) onConnect();

    saSocket.on("connect", onConnect);
    saSocket.on("disconnect", onDisconnect);
    saSocket.on("superadmin:all_states", onAllStates);
    saSocket.on("superadmin:room_update", onRoomUpdate);

    return () => {
      saSocket.off("connect", onConnect);
      saSocket.off("disconnect", onDisconnect);
      saSocket.off("superadmin:all_states", onAllStates);
      saSocket.off("superadmin:room_update", onRoomUpdate);
    };
  }, []);

  const blockRoom = useCallback((roomId: string, blocked: boolean) => {
    saSocket.emit("superadmin:block", { roomId, blocked });
  }, []);

  const resetRoom = useCallback((roomId: string) => {
    saSocket.emit("superadmin:reset_room", { roomId });
  }, []);

  const resetAll = useCallback(() => {
    saSocket.emit("superadmin:reset_all");
  }, []);

  return { roomStates, isConnected, blockRoom, resetRoom, resetAll };
}
