import { useParams, Link } from "wouter";
import { useTimer, TimerMode } from "@/hooks/use-timer";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function AdminView() {
  const { id } = useParams<{ id: string }>();
  const { state, setTimer, resetTimer, setMode } = useTimer(id || "1");

  const [localMins, setLocalMins] = useState(0);
  const [localSecs, setLocalSecs] = useState(0);

  // Sync inputs with server state if timer is not running
  // but let operator freely edit when they want to change it.
  // Given it's a broadcast timer, typically we don't auto-override inputs,
  // we let the operator prepare the NEXT timer while the current one is running.

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field (though we have none yet, good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Enter") {
        e.preventDefault();
        setTimer(localMins * 60 + localSecs, state.mode);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetTimer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localMins, localSecs, state.mode, setTimer, resetTimer]);

  const handleSetMode = (m: TimerMode) => {
    setMode(m);
  };

  const handleStart = () => {
    setTimer(localMins * 60 + localSecs, state.mode);
  };

  const adjustValue = (type: "mins" | "secs", delta: number) => {
    if (type === "mins") {
      setLocalMins(prev => Math.max(0, Math.min(99, prev + delta)));
    } else {
      setLocalSecs(prev => {
        const next = prev + delta;
        if (next > 59) return 59;
        if (next < 0) return 0;
        return next;
      });
    }
  };

  const quickSet = (mins: number) => {
    setLocalMins(mins);
    setLocalSecs(0);
    // Auto-start for quick triggers
    setTimer(mins * 60, state.mode);
  };

  const displayMins = localMins.toString().padStart(2, "0");
  const displaySecs = localSecs.toString().padStart(2, "0");

  const statusText = `${state.running ? "RODANDO" : "PARADO"} | ${state.mode === "countdown" ? "REGRESSIVO" : "PROGRESSIVO"}`;

  return (
    <div className="min-h-screen w-full bg-[#0d1321] font-sans flex flex-col relative text-white items-center justify-center">
      
      <div className="absolute top-6 right-6">
         <Link href={`/sala/${id}`} className="text-xs border border-white/20 px-4 py-2 rounded text-gray-300 font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors">
           Modo Tela
         </Link>
      </div>

      <div className="bg-[#1a2333] border border-white/10 rounded-xl w-full max-w-[500px] p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase mb-3">Painel de Controle</h1>
          <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-gray-400">{statusText}</div>
        </div>

        <div className="grid grid-cols-2 gap-0 border border-white/10 rounded-lg overflow-hidden mb-8">
          <button 
            onClick={() => handleSetMode("countdown")}
            className={`py-3.5 text-xs font-bold tracking-[0.2em] transition-colors ${state.mode === "countdown" ? "bg-white text-[#1a2333]" : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-white"}`}
          >
            REGRESSIVO
          </button>
          <button 
            onClick={() => handleSetMode("countup")}
            className={`py-3.5 text-xs font-bold tracking-[0.2em] transition-colors ${state.mode === "countup" ? "bg-white text-[#1a2333]" : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-white"}`}
          >
            PROGRESSIVO
          </button>
        </div>

        <div className="flex justify-center items-center mb-8 px-6">
          {/* MIN Column */}
          <div className="flex flex-col items-center w-28">
            <span className="text-[10px] tracking-[0.2em] text-gray-500 font-bold mb-3 uppercase">Min</span>
            <div className="w-full border border-white/10 rounded-lg overflow-hidden bg-[#0d1321]">
              <button onClick={() => adjustValue("mins", 1)} className="p-2.5 text-gray-400 hover:text-white bg-[#1a2333] border-b border-white/10 hover:bg-white/5 w-full flex justify-center transition-colors">
                <ChevronUp size={20} strokeWidth={2.5} />
              </button>
              <div className="w-full text-center py-5 text-4xl font-black font-mono tracking-tighter">
                {displayMins}
              </div>
              <button onClick={() => adjustValue("mins", -1)} className="p-2.5 text-gray-400 hover:text-white bg-[#1a2333] border-t border-white/10 hover:bg-white/5 w-full flex justify-center transition-colors">
                <ChevronDown size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="text-3xl font-black mx-6 mt-6 opacity-30">:</div>

          {/* SEC Column */}
          <div className="flex flex-col items-center w-28">
            <span className="text-[10px] tracking-[0.2em] text-gray-500 font-bold mb-3 uppercase">Seg</span>
            <div className="w-full border border-white/10 rounded-lg overflow-hidden bg-[#0d1321]">
              <button onClick={() => adjustValue("secs", 1)} className="p-2.5 text-gray-400 hover:text-white bg-[#1a2333] border-b border-white/10 hover:bg-white/5 w-full flex justify-center transition-colors">
                <ChevronUp size={20} strokeWidth={2.5} />
              </button>
              <div className="w-full text-center py-5 text-4xl font-black font-mono tracking-tighter">
                {displaySecs}
              </div>
              <button onClick={() => adjustValue("secs", -1)} className="p-2.5 text-gray-400 hover:text-white bg-[#1a2333] border-t border-white/10 hover:bg-white/5 w-full flex justify-center transition-colors">
                <ChevronDown size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-[#5a4cee] hover:bg-[#6b5df6] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-4 transition-colors mb-4 uppercase tracking-[0.15em] text-[13px] relative group shadow-lg shadow-[#5a4cee]/20"
        >
          Definir e Iniciar
          <span className="absolute right-4 text-[9px] bg-black/20 text-white/80 px-2 py-1 rounded border border-black/10 group-hover:bg-black/30 font-mono tracking-wider">[ENTER]</span>
        </button>

        <button 
          onClick={resetTimer}
          className="w-full bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/30 text-gray-300 hover:text-white font-bold py-4 rounded-lg flex items-center justify-center gap-4 transition-colors mb-8 uppercase tracking-[0.15em] text-[13px] relative group"
        >
          Resetar Timer
          <span className="absolute right-4 text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/10 group-hover:bg-white/10 group-hover:text-white font-mono tracking-wider">[R]</span>
        </button>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-center text-[10px] tracking-[0.2em] text-gray-500 font-bold uppercase mb-4">Gatilhos Rápidos</h3>
          <div className="grid grid-cols-4 gap-3">
            {[1, 3, 5, 15].map(m => (
              <button 
                key={m}
                onClick={() => quickSet(m)}
                className="bg-transparent border border-white/10 hover:border-white/30 hover:bg-[#253247] hover:text-white text-gray-300 py-3 rounded-lg font-bold text-sm transition-colors flex flex-col items-center tracking-wider"
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
