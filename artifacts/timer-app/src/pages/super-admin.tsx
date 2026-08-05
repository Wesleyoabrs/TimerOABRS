import { useLocation } from "wouter";
import { useSuperAdmin } from "@/hooks/use-superadmin";
import { ROOMS } from "@/config/rooms";
import { useState, KeyboardEvent } from "react";

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { roomStates, isConnected, blockRoom, resetRoom, resetAll, setRoomName } = useSuperAdmin();
  // Local name inputs — keyed by roomId, tracks what the user is typing
  const [localNames, setLocalNames] = useState<Record<string, string>>({});

  function getNameValue(roomId: string): string {
    if (localNames[roomId] !== undefined) return localNames[roomId];
    return roomStates[roomId]?.customName ?? "";
  }

  function saveName(roomId: string) {
    const name = getNameValue(roomId);
    setRoomName(roomId, name);
    // Clear local draft so we track server value again
    setLocalNames(prev => { const n = { ...prev }; delete n[roomId]; return n; });
  }

  function handleNameKey(e: KeyboardEvent<HTMLInputElement>, roomId: string) {
    if (e.key === "Enter") { e.currentTarget.blur(); }
    if (e.key === "Escape") {
      setLocalNames(prev => { const n = { ...prev }; delete n[roomId]; return n; });
      e.currentTarget.blur();
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#07090f] text-white font-sans p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-2">
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-white">
              Super Admin
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-500"}`} />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetAll}
              className="px-5 py-2.5 bg-red-600/20 border border-red-500/50 hover:bg-red-600/35 hover:border-red-400 text-red-400 hover:text-red-300 font-bold uppercase tracking-widest text-xs rounded-lg transition-all"
            >
              Resetar Todos
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 border border-white/20 hover:bg-white/10 text-gray-300 hover:text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all"
            >
              ← Salas
            </button>
          </div>
        </div>

        {/* Room grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ROOMS.map((room) => {
            const s = roomStates[room.id];
            const isRunning = s?.running ?? false;
            const isBlocked = s?.blocked ?? false;
            const time = s ? formatTime(s.currentSeconds) : "--:--";
            const mode = s?.mode === "countup" ? "PROGRESSIVO" : "REGRESSIVO";
            const nameValue = getNameValue(room.id);

            return (
              <div
                key={room.id}
                className={`rounded-xl border-2 p-5 flex flex-col gap-3 transition-all ${
                  isBlocked
                    ? "bg-red-950/20 border-red-700/40"
                    : "bg-[#111827] border-white/10"
                }`}
              >
                {/* Room header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Sala {room.id}
                    </div>
                    <div className="text-sm font-black text-white tracking-wide">
                      {room.floor}° andar
                    </div>
                    {room.sublabel && (
                      <div className="text-[10px] text-gray-600 font-bold mt-0.5 uppercase tracking-wide">
                        {room.sublabel}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isBlocked && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 px-2 py-0.5 rounded-full border border-red-600/40">
                        Bloqueada
                      </span>
                    )}
                    {isRunning && !isBlocked && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        Rodando
                      </span>
                    )}
                    {!isRunning && !isBlocked && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                        Parado
                      </span>
                    )}
                  </div>
                </div>

                {/* Timer display */}
                <div
                  className={`text-4xl font-black font-mono text-center py-3 rounded-lg tracking-tight ${
                    isBlocked ? "text-red-700/50" : isRunning ? "text-white" : "text-gray-600"
                  }`}
                >
                  {time}
                </div>

                {/* Mode */}
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 text-center">
                  {mode}
                </div>

                {/* Custom name input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">
                    Nome da sala
                  </label>
                  <input
                    type="text"
                    value={nameValue}
                    placeholder="Opcional…"
                    maxLength={60}
                    onChange={e =>
                      setLocalNames(prev => ({ ...prev, [room.id]: e.target.value }))
                    }
                    onBlur={() => saveName(room.id)}
                    onKeyDown={e => handleNameKey(e, room.id)}
                    className="w-full bg-[#0d1321] border border-white/10 focus:border-[#5a4cee]/60 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-700 outline-none transition-colors font-medium"
                  />
                  <p className="text-[9px] text-gray-700">Enter para salvar · Esc para cancelar</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => resetRoom(room.id)}
                    disabled={isBlocked}
                    className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/8 hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Resetar
                  </button>
                  <button
                    onClick={() => blockRoom(room.id, !isBlocked)}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                      isBlocked
                        ? "border-green-600/50 text-green-400 hover:bg-green-600/15"
                        : "border-red-600/40 text-red-400 hover:bg-red-600/15"
                    }`}
                  >
                    {isBlocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>

                {/* Link to room admin */}
                <a
                  href={`/sala/${room.id}/admin`}
                  className="text-center text-[10px] text-gray-700 hover:text-gray-400 uppercase tracking-widest font-bold transition-colors"
                >
                  Abrir Admin ↗
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-[10px] text-gray-800 uppercase tracking-widest font-bold">
          Acesso restrito — Super Admin
        </div>
      </div>
    </div>
  );
}
