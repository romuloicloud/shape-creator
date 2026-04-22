import { Activity, Play, Settings, ExternalLink, Timer, Focus, Target } from "lucide-react";
import { CardioProtocol } from "@/types/workout";

export function CardioDashboard({
  profile,
  cardioProtocol,
  openCardioPlayer
}: {
  profile: any;
  cardioProtocol: CardioProtocol | null;
  openCardioPlayer: () => void;
}) {
  if (!cardioProtocol) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Activity size={48} className="text-red-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">ENDURANCE NÃO DETECTADO</h2>
        <p className="text-gray-400 text-sm">Realize um escaneamento corporal para a IA prescrever a via metabólica correta para o seu biotipo.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-500">
      
      {/* HUD Header */}
      <div className="w-full glass-panel p-5 border-l-4 border-l-red-500 flex flex-col mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 text-red-500/10 rotate-12 pointer-events-none">
          <Activity size={100} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-red-500" />
          <h3 className="text-red-500 font-bold tracking-widest text-xs uppercase">{cardioProtocol.method}</h3>
        </div>
        <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{cardioProtocol.focus}</h2>
        
        <div className="flex items-center gap-4 mt-4">
          <div>
            <p className="text-[10px] text-gray-400 tracking-wider font-mono">DURAÇÃO</p>
            <p className="font-bold text-white flex items-baseline gap-1">
              <span className="text-2xl">{cardioProtocol.totalDuration}</span><span className="text-xs text-red-500">MIN</span>
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-[10px] text-gray-400 tracking-wider font-mono">FREQUÊNCIA</p>
            <p className="font-bold text-white flex items-baseline gap-1">
              <span className="text-2xl">{cardioProtocol.frequencySemanal}</span><span className="text-xs text-red-500">X/SEM</span>
            </p>
          </div>
        </div>
      </div>

      {/* Fases do Treino */}
      <div className="w-full mb-6">
        <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-4 flex items-center justify-between">
          <span>ALGORITMO DA SESSÃO</span>
          <Settings size={14} />
        </h3>
        <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {cardioProtocol.phases.map((phase, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0f172a] shadow-[0_0_0_3px_#0f172a] border border-white/10 z-10 text-white font-bold p-1">
                {phase.intensityZone === 'Z1' && <span className="text-blue-400 text-xs">Z1</span>}
                {phase.intensityZone === 'Z2' && <span className="text-green-400 text-xs">Z2</span>}
                {phase.intensityZone === 'Z3' && <span className="text-yellow-400 text-xs">Z3</span>}
                {phase.intensityZone === 'Z4' && <span className="text-orange-500 text-xs">Z4</span>}
                {phase.intensityZone === 'Z5' && <span className="text-red-500 text-xs">Z5</span>}
              </div>
              
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl border border-white/5 transition-all hover:border-white/20 hover:bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-white">{phase.name}</h4>
                  <span className="text-xs font-mono text-gray-400">{phase.durationMinutes}m</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-light">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={openCardioPlayer}
        className="w-full relative py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all z-10 bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] group overflow-hidden mt-2"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite] pointer-events-none" />
        <Play className="fill-white" size={20} />
        INICIAR DESAFIO GLOBAL
      </button>

    </div>
  );
}
