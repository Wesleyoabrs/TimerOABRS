import { Link } from "wouter";

export default function Home() {
  const rooms = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen w-full bg-[#0d1321] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-widest uppercase mb-2 mt-12">Timer System</h1>
        <p className="text-gray-400 mb-16 uppercase text-sm tracking-widest">Broadcast Control Panel</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full">
          {rooms.map((num) => (
            <Link key={num} href={`/sala/${num}`} className="block group">
              <div className="bg-[#1a2333] border border-white/10 rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-[#253247] group-hover:border-white/30 group-hover:shadow-2xl group-hover:-translate-y-1 cursor-pointer">
                <span className="text-5xl font-black mb-3 opacity-90 group-hover:opacity-100 transition-opacity">{num}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-200">Sala {num}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 border border-white/10 bg-[#1a2333]/50 p-6 rounded-lg text-center max-w-2xl">
          <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
            Click a room above to open the full-screen timer display.<br/>
            To access the operator control panel, append <code className="bg-black px-2 py-1 rounded text-[#5a4cee] font-mono text-xs font-bold mx-1">/admin</code> to the room URL.
          </p>
        </div>
      </div>
    </div>
  );
}
