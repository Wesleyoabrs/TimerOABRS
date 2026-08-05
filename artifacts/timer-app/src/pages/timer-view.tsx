import { useParams, Link } from "wouter";
import { useTimer } from "@/hooks/use-timer";
import { useEffect, useState } from "react";
import { ROOMS } from "@/config/rooms";

export default function TimerView() {
  const { id } = useParams<{ id: string }>();
  const { state } = useTimer(id || "1");
  const [showBlink, setShowBlink] = useState(true);
  const [flashOn, setFlashOn] = useState(true);

  const room = ROOMS.find(r => r.id === id);
  const isZero = state.currentSeconds === 0 && !state.running && state.mode === "countdown" && state.totalSeconds > 0;

  // Colon blink while running
  useEffect(() => {
    if (!state.running) {
      setShowBlink(true);
      return;
    }
    const interval = setInterval(() => setShowBlink(p => !p), 500);
    return () => clearInterval(interval);
  }, [state.running]);

  // Full-screen flash when time is up
  useEffect(() => {
    if (!isZero) {
      setFlashOn(true);
      return;
    }
    const interval = setInterval(() => setFlashOn(p => !p), 700);
    return () => clearInterval(interval);
  }, [isZero]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return {
      mins: m.toString().padStart(2, "0"),
      secs: s.toString().padStart(2, "0"),
    };
  };

  const { mins, secs } = formatTime(state.currentSeconds);

  // Blocked screen
  if (state.blocked) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="text-red-600 font-black uppercase tracking-[0.3em] text-2xl mb-4">
          Sala Bloqueada
        </div>
        <div className="text-gray-600 text-sm uppercase tracking-widest">
          {room ? `${room.floor}° andar` : `Sala ${id}`}
        </div>
      </div>
    );
  }

  // Flash state: red bg + light-gray digits ↔ black bg + red digits
  const bgColor = isZero ? (flashOn ? "#b91c1c" : "#000000") : "#000000";
  const textColor = isZero ? (flashOn ? "#d1d5db" : "#b91c1c") : "#ffffff";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden relative selection:bg-transparent cursor-default"
      style={{ backgroundColor: bgColor, transition: "background-color 0.55s ease-in-out" }}
    >
      <div
        className="font-black flex items-center justify-center"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "clamp(20vw, 30vw, 45vh)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: textColor,
          transition: "color 0.55s ease-in-out",
        }}
      >
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{mins}</span>
        <span
          className="relative -top-[1vw] mx-[0.5vw]"
          style={{ opacity: isZero ? 1 : (showBlink ? 1 : 0) }}
        >
          :
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{secs}</span>
      </div>

      <Link
        href={`/sala/${id}/admin`}
        className="absolute top-4 right-4 text-transparent hover:text-white text-xs font-bold tracking-widest uppercase py-2 px-4 rounded border border-transparent hover:border-white/30 hover:bg-white/10 transition-all duration-200"
      >
        CONTROLE
      </Link>
    </div>
  );
}
