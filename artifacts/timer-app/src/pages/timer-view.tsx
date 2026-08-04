import { useParams, Link } from "wouter";
import { useTimer } from "@/hooks/use-timer";
import { useEffect, useState } from "react";

export default function TimerView() {
  const { id } = useParams<{ id: string }>();
  const { state } = useTimer(id || "1");
  const [showBlink, setShowBlink] = useState(true);

  const isZero = state.currentSeconds === 0 && !state.running && state.mode === "countdown";

  useEffect(() => {
    if (!state.running) {
      setShowBlink(true);
      return;
    }

    // Blinking colon effect when running
    const interval = setInterval(() => {
      setShowBlink((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [state.running]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return {
      mins: m.toString().padStart(2, "0"),
      secs: s.toString().padStart(2, "0"),
    };
  };

  const { mins, secs } = formatTime(state.currentSeconds);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative selection:bg-transparent cursor-default">
      <div 
        className={`font-black flex items-center justify-center transition-colors duration-300 ${isZero ? 'text-red-600' : 'text-white'}`}
        style={{ 
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(20vw, 30vw, 45vh)',
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mins}</span>
        <span 
          className="relative -top-[1vw] mx-[0.5vw]" 
          style={{ opacity: showBlink ? 1 : 0 }}
        >
          :
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{secs}</span>
      </div>

      <Link 
        href={`/sala/${id}/admin`} 
        className="absolute top-4 right-4 text-white text-xs font-bold tracking-widest uppercase py-2 px-4 rounded border border-white/30 bg-white/10 hover:bg-white/20 transition-colors"
      >
        CONTROLE
      </Link>
    </div>
  );
}
