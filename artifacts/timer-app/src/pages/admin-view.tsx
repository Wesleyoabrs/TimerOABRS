import { useParams, Link } from "wouter";
import { useTimer, TimerMode } from "@/hooks/use-timer";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function AdminView() {
  const { id } = useParams<{ id: string }>();
  const { state, setTimer, resetTimer, setMode } = useTimer(id || "1");

  const [localMins, setLocalMins] = useState(0);
  const [localSecs, setLocalSecs] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleSetMode = (m: TimerMode) => setMode(m);
  const handleStart = () => setTimer(localMins * 60 + localSecs, state.mode);

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
    setTimer(mins * 60, state.mode);
  };

  const displayMins = localMins.toString();
  const displaySecs = localSecs.toString();

  const isRunning = state.running;
  const modeLabel = state.mode === "countdown" ? "REGRESSIVO" : "PROGRESSIVO";

  return (
    <div className="min-h-screen w-full bg-[#0d1321] font-sans flex flex-col relative text-white items-center justify-center px-4 py-16">

      {/* Top nav */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg border border-white/30 text-white bg-white/5 hover:bg-white/15 transition-colors"
        >
          ← Salas
        </Link>

        <Link
          href={`/sala/${id}`}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg border border-[#5a4cee]/60 text-[#a99dff] bg-[#5a4cee]/10 hover:bg-[#5a4cee]/25 transition-colors"
        >
          Modo Tela ↗
        </Link>
      </div>

      {/* Card */}
      <div className="bg-[#1a2333] border border-white/15 rounded-2xl w-full max-w-[520px] p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-black tracking-[0.18em] uppercase mb-3 text-white">
            Painel de Controle
          </h1>
          <div className="text-sm font-bold tracking-widest uppercase">
            <span className="text-gray-400">Sala</span>
            <span className="text-white font-black ml-2">{id}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.5)]" : "bg-gray-500"}`} />
          <span className={`text-sm font-black tracking-[0.2em] uppercase ${isRunning ? "text-green-400" : "text-gray-400"}`}>
            {isRunning ? "RODANDO" : "PARADO"}
          </span>
          <span className="text-gray-600 font-bold">|</span>
          <span className="text-sm font-black tracking-[0.2em] uppercase text-white/70">
            {modeLabel}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-0 border-2 border-white/15 rounded-xl overflow-hidden mb-7">
          <button
            onClick={() => handleSetMode("countdown")}
            className={`py-4 text-sm font-black tracking-[0.15em] transition-all ${
              state.mode === "countdown"
                ? "bg-white text-[#0d1321]"
                : "bg-transparent text-gray-500 hover:bg-white/8 hover:text-white"
            }`}
          >
            REGRESSIVO
          </button>
          <button
            onClick={() => handleSetMode("countup")}
            className={`py-4 text-sm font-black tracking-[0.15em] transition-all ${
              state.mode === "countup"
                ? "bg-white text-[#0d1321]"
                : "bg-transparent text-gray-500 hover:bg-white/8 hover:text-white"
            }`}
          >
            PROGRESSIVO
          </button>
        </div>

        {/* Time inputs */}
        <div className="flex justify-center items-center gap-4 mb-7">
          {/* MIN */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs tracking-[0.25em] text-gray-400 font-bold mb-2.5 uppercase">MIN</span>
            <div className="w-full border-2 border-white/15 rounded-xl overflow-hidden bg-[#0d1321]">
              <button
                onClick={() => adjustValue("mins", 1)}
                className="w-full py-3 text-gray-300 hover:text-white hover:bg-white/10 flex justify-center transition-colors border-b border-white/10"
              >
                <ChevronUp size={22} strokeWidth={3} />
              </button>
              <div className="w-full text-center py-5 text-5xl font-black font-mono text-white">
                {displayMins}
              </div>
              <button
                onClick={() => adjustValue("mins", -1)}
                className="w-full py-3 text-gray-300 hover:text-white hover:bg-white/10 flex justify-center transition-colors border-t border-white/10"
              >
                <ChevronDown size={22} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="text-4xl font-black text-white/40 mb-1 mt-7">:</div>

          {/* SEG */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs tracking-[0.25em] text-gray-400 font-bold mb-2.5 uppercase">SEG</span>
            <div className="w-full border-2 border-white/15 rounded-xl overflow-hidden bg-[#0d1321]">
              <button
                onClick={() => adjustValue("secs", 1)}
                className="w-full py-3 text-gray-300 hover:text-white hover:bg-white/10 flex justify-center transition-colors border-b border-white/10"
              >
                <ChevronUp size={22} strokeWidth={3} />
              </button>
              <div className="w-full text-center py-5 text-5xl font-black font-mono text-white">
                {displaySecs}
              </div>
              <button
                onClick={() => adjustValue("secs", -1)}
                className="w-full py-3 text-gray-300 hover:text-white hover:bg-white/10 flex justify-center transition-colors border-t border-white/10"
              >
                <ChevronDown size={22} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full bg-[#5a4cee] hover:bg-[#6b5ef5] active:bg-[#4a3cde] text-white font-black py-5 rounded-xl flex items-center justify-center transition-all mb-3 uppercase tracking-[0.18em] text-base shadow-lg shadow-[#5a4cee]/30 hover:shadow-[#5a4cee]/50"
        >
          Definir e Iniciar
          <span className="ml-3 text-[10px] bg-black/25 text-white/70 px-2 py-1 rounded font-mono tracking-wider">[ENTER]</span>
        </button>

        {/* Reset button */}
        <button
          onClick={resetTimer}
          className="w-full bg-transparent border-2 border-white/20 hover:border-red-500/60 hover:bg-red-500/8 text-gray-300 hover:text-red-400 font-bold py-4 rounded-xl flex items-center justify-center transition-all mb-7 uppercase tracking-[0.15em] text-sm"
        >
          Resetar Timer
          <span className="ml-3 text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded border border-white/10 font-mono tracking-wider">[R]</span>
        </button>

        {/* Quick triggers */}
        <div className="border-t-2 border-white/10 pt-6">
          <h3 className="text-center text-xs tracking-[0.25em] text-gray-400 font-bold uppercase mb-4">
            Gatilhos Rápidos
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[1, 3, 5, 15].map(m => (
              <button
                key={m}
                onClick={() => quickSet(m)}
                className="border-2 border-white/20 hover:border-[#5a4cee]/70 hover:bg-[#5a4cee]/15 hover:text-white text-gray-300 py-3.5 rounded-xl font-black text-base transition-all tracking-wide"
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
