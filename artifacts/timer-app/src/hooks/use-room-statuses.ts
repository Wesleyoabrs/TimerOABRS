import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface RoomStatus {
  roomId: string;
  blocked: boolean;
  customName: string;
}

const viewerSocket: Socket = io({
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

export function useRoomStatuses() {
  const [statuses, setStatuses] = useState<Record<string, RoomStatus>>({});

  useEffect(() => {
    function join() {
      viewerSocket.emit("viewer:join");
    }

    function onAllStatuses(list: RoomStatus[]) {
      const map: Record<string, RoomStatus> = {};
      list.forEach(s => { map[s.roomId] = s; });
      setStatuses(map);
    }

    function onRoomStatus(s: RoomStatus) {
      setStatuses(prev => ({ ...prev, [s.roomId]: s }));
    }

    if (viewerSocket.connected) join();
    viewerSocket.on("connect", join);
    viewerSocket.on("viewer:all_statuses", onAllStatuses);
    viewerSocket.on("viewer:room_status", onRoomStatus);

    return () => {
      viewerSocket.off("connect", join);
      viewerSocket.off("viewer:all_statuses", onAllStatuses);
      viewerSocket.off("viewer:room_status", onRoomStatus);
    };
  }, []);

  return statuses;
}
