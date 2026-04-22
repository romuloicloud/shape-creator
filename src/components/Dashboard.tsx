import { Flame, Target, ArrowRight, Activity, Sparkles } from "lucide-react";
import { WorkoutProtocol, WORKOUTS } from "@/types/workout";

export function Dashboard({
  profile,
  displayMacros,
  bmi,
  openWorkout,
  aiProtocols,
  aiDiagnostico,
}: {
  profile: any;
  displayMacros: any;
  bmi: string | number;
  openWorkout: (w: WorkoutProtocol) => void;
  aiProtocols?: WorkoutProtocol[] | null;
  aiDiagnostico?: any;
}) {
  const protocolos = aiProtocols && aiProtocols.length > 0 ? aiProtocols : WORKOUTS;
  const isAiActive = !!aiProtocols && aiProtocols.length > 0;

  return (
    <div className="w-full max-w-lg mt-8 z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="glass-panel p-5 border-t-2 border-t-neon mb-6 relative overflow-hidden">
        {aiDiagnostico && <div className="absolute top-2 right-2 px-2 py-1 bg-neon/20 rounded text-xs text-neon flex items-center gap-1 font-bold animate-pulse"><Sparkles size={12}/> IA CLINIC</div>}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-mono text-neon font-bold tracking-widest">{isAiActive ? "LAUDO DA IA" : "LAUDO BIOMECÂNICO"}</h2>
          <span className="text-xs bg-neon/20 text-neon px-2 py-1 rounded">IMC: {bmi}</span>
        </div>
        
        {isAiActive && aiDiagnostico?.biotipo && (
          <div className="flex flex-wrap gap-2 mb-3">
             <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-bold border border-blue-500/30">Biotipo: {aiDiagnostico.biotipo}</span>
             <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded font-bold border border-orange-500/30">⏰ {aiDiagnostico.tempo_ideal_treino_minutos}</span>
          </div>
        )}
        
        <p className="text-sm text-gray-300">
          {aiDiagnostico?.detalhes || "Foco Tático: Simetria e Recomposição Corporal. Cadeia posterior prioridade."}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-slate-800/50 rounded-lg p-2 relative overflow-hidden">
             {aiDiagnostico?.cifose_grau > 0 && <span className="absolute bottom-0 left-0 w-full h-1 bg-red-500/50"></span>}
            <p className="text-xs text-gray-400">Peso</p>
            <p className="font-bold">{profile?.weight_kg ?? "—"} kg</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Calorias IA</p>
            <p className="font-bold flex justify-center items-center gap-1 text-orange-400">
              <Flame size={14} /> {displayMacros?.calories ?? "—"}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 relative overflow-hidden">
            {aiDiagnostico?.escoliose_desvio > 0 && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500/50"></span>}
            <p className="text-xs text-gray-400">Proteína</p>
            <p className="font-bold">{displayMacros?.protein_g ?? "—"} g</p>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Target className="text-neon" /> {isAiActive ? "FICHAS SEMANAIS (IA)" : "ROUTINES PRE-DEFINIDAS"}
      </h3>

      <div className="flex flex-col gap-3">
        {protocolos.map((workout: any) => {
          const isAi = isAiActive;
          return (
            <button key={workout.id} onClick={() => openWorkout(workout as WorkoutProtocol)}
              className={`w-full text-left glass-panel p-4 flex items-center justify-between transition-all group relative overflow-hidden ${isAi ? "border border-neon bg-neon/10" : "hover:border-neon/60"}`}
            >
              {isAi && <div className="absolute top-0 right-0 w-24 h-24 bg-neon/20 blur-2xl rounded-full" />}
              <div className="relative z-10">
                <span className="text-xs text-neon font-bold flex items-center gap-1">
                  {isAi ? <><Sparkles size={12}/> PRESCRITO PELA IA</> : <>{workout.label}{workout.priority ? " · PRIORIDADE" : ""}</>}
                </span>
                <h4 className="font-bold text-white group-hover:text-neon mt-1">{workout.name || workout.title}</h4>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Activity size={12} /> {workout.focus || workout.objective} · {workout.exercises?.length ?? 0} exercícios
                </p>
              </div>
              <div className={`relative z-10 p-2 rounded-full transition-colors flex-shrink-0 ml-3 ${isAi || workout.priority ? "bg-neon text-black shadow-[0_0_15px_rgba(204,255,0,0.5)]" : "bg-white/10 text-white group-hover:bg-neon group-hover:text-black"}`}>
                <ArrowRight size={20} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
}
