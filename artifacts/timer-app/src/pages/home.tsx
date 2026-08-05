import { Link, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { ROOMS } from "@/config/rooms";

const CHEAT_CODE = "2236";

export default function Home() {
  const [, navigate] = useLocation();
  const bufferRef = useRef<string>("");

  // Secret cheat code: type 2236 anywhere on this page
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.key.match(/^\d$/)) {
        bufferRef.current = "";
        return;
      }
      bufferRef.current = (bufferRef.current + e.key).slice(-CHEAT_CODE.length);
      if (bufferRef.current === CHEAT_CODE) {
        bufferRef.current = "";
        navigate("/superadmin");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-[#0d1321] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-widest uppercase mb-2 mt-12">
          Sistema de Timers
        </h1>
        <p className="text-gray-400 mb-16 uppercase text-sm tracking-widest">
          Selecione uma sala para iniciar
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full">
          {ROOMS.map((room) => (
            <Link key={room.id} href={`/sala/${room.id}`} className="block group">
              <div className="bg-[#1a2333] border border-white/10 rounded-xl p-7 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-[#253247] group-hover:border-white/30 group-hover:shadow-2xl group-hover:-translate-y-1 cursor-pointer">
                <span className="text-4xl font-black mb-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  {room.floor}°
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-200 font-bold">
                  andar
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 border border-white/10 bg-[#1a2333]/50 p-6 rounded-lg text-center max-w-2xl">
          <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
            Clique em um andar para abrir a tela do timer.<br />
            Para acessar o painel de controle, adicione{" "}
            <code className="bg-black px-2 py-1 rounded text-[#5a4cee] font-mono text-xs font-bold mx-1">
              /admin
            </code>{" "}
            ao final da URL da sala.
          </p>
        </div>
      </div>
    </div>
  );
}
