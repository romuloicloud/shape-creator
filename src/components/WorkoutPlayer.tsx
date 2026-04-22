import { ChevronLeft, CheckCircle2, Play, Check, Timer, SkipForward, Activity } from "lucide-react";
import { WorkoutProtocol, Exercise } from "@/types/workout";

export function WorkoutPlayer({
  activeWorkout,
  currentExerciseIdx,
  currentExercise,
  totalExercises,
  currentSet,
  totalSets,
  isExerciseDone,
  isLastExercise,
  workoutPhase,
  cadenceState,
  timeLeft,
  fmt,
  setActiveWorkout,
  goToNextExercise,
  toggleWorkout,
  jumpToExercise,
}: {
  activeWorkout: WorkoutProtocol;
  currentExerciseIdx: number;
  currentExercise: Exercise | null;
  totalExercises: number;
  currentSet: number;
  totalSets: number;
  isExerciseDone: boolean;
  isLastExercise: boolean;
  workoutPhase: "idle" | "running" | "resting";
  cadenceState: { phase: "down" | "pause" | "up", timer: number };
  timeLeft: number;
  fmt: (s: number) => string;
  setActiveWorkout: (w: WorkoutProtocol | null) => void;
  goToNextExercise: () => void;
  toggleWorkout: () => void;
  jumpToExercise: (idx: number) => void;
}) {
  if (!currentExercise) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center px-6 py-8 pb-10 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full flex items-center justify-between mb-4 mt-2">
        <button onClick={() => setActiveWorkout(null)} className="bg-white/10 p-2 rounded-xl text-white hover:text-neon transition-colors flex-shrink-0">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold font-mono tracking-widest text-neon mr-2">{activeWorkout.label}</h2>
      </div>

      <div className="w-full overflow-x-auto flex items-center gap-3 py-4 mb-2 scrollbar-none px-2 -mx-2">
        {activeWorkout.exercises.map((ex, idx) => (
          <div key={idx} onClick={() => jumpToExercise(idx)} className={`whitespace-nowrap flex items-center justify-center flex-shrink-0 px-4 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-bold border transition-all duration-300 cursor-pointer ${idx < currentExerciseIdx ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:bg-green-500/20" : idx === currentExerciseIdx ? "bg-neon text-black border-neon shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-110" : "bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:bg-white/10"}`}>
            {ex.name}
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm flex flex-col items-center text-center flex-1">
        <div className="flex flex-col items-center gap-1 mb-6">
          <p className="text-[10px] text-neon/70 font-mono tracking-widest bg-neon/10 px-3 py-1 rounded-full border border-neon/20">EXERCÍCIO {currentExerciseIdx + 1} / {totalExercises}</p>
        </div>

        <h1 className="text-5xl font-extrabold text-white mb-1 leading-tight">
          {isExerciseDone ? "FEITO!" : `${currentSet} / ${totalSets}`}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isExerciseDone ? (isLastExercise ? "Treino finalizado. Missão cumprida." : "Próximo exercício aguarda.") : `${currentExercise.reps} repetições`}
        </p>

        {!isExerciseDone && (
          <div className={`w-full glass-panel p-5 border neon-glow flex justify-around mb-4 transition-opacity duration-300 ${workoutPhase === "running" ? "opacity-100 ring-2 ring-neon/40" : "opacity-60"}`}>
            {[
              { phase: "down", baseTime: currentExercise.cadence.down, label: "DESCIDA" }, 
              { phase: "pause", baseTime: currentExercise.cadence.pause, label: "PAUSA" }, 
              { phase: "up", baseTime: currentExercise.cadence.up, label: "SUBIDA" }
            ].map((c, i) => {
              const isActive = workoutPhase === "running" && cadenceState.phase === c.phase;
              const displayTime = isActive ? cadenceState.timer : c.baseTime;
              let color = "text-white";
              if (isActive) color = "text-neon drop-shadow-[0_0_8px_#00f0ff]";
              else if (c.phase === "up") color = "text-neon/80";

              return (
                <div key={i} className={`flex flex-col items-center transition-all duration-300 ${isActive ? "scale-110" : ""}`}>
                  {i > 0 && <div className="absolute w-px h-10 bg-gray-700" />}
                  <span className={`text-3xl font-black ${color}`}>{displayTime}<span className="text-base opacity-50">s</span></span>
                  <span className={`text-[10px] font-mono mt-1 tracking-widest ${isActive ? "text-white font-bold" : (c.phase === "up" ? "text-neon/80" : "text-gray-400")}`}>{c.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {!isExerciseDone && (
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalSets }).map((_, idx) => (
              <div key={idx} className={`w-3 h-3 rounded-full transition-all duration-300 ${idx < currentSet - 1 ? "bg-green-400" : idx === currentSet - 1 ? "bg-neon shadow-[0_0_8px_#00f0ff] scale-125" : "bg-slate-700"}`} />
            ))}
          </div>
        )}

        <div className="relative flex items-center justify-center my-4">
          {!isExerciseDone && workoutPhase !== "resting" && (
            <>
              <div className="absolute w-48 h-48 border-[3px] border-dashed border-gray-700 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className={`absolute w-40 h-40 border-[2px] rounded-full transition-all ${workoutPhase === "running" ? "border-neon neon-glow animate-pulse" : "border-neon/30"}`} />
            </>
          )}

          {isExerciseDone ? (
            <button onClick={goToNextExercise}
              className={`relative px-8 py-5 rounded-full flex items-center gap-3 font-black text-base hover:scale-105 active:scale-95 transition-transform z-10 ${isLastExercise ? "bg-green-500 text-black shadow-[0_0_30px_#22c55e]" : "bg-neon text-black shadow-neon"}`}
            >
              <CheckCircle2 size={22} />
              {isLastExercise ? "FINALIZAR TREINO" : "PRÓXIMO EXERCÍCIO"}
            </button>
          ) : (
            <button onClick={toggleWorkout}
              className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all z-10
                ${workoutPhase === "idle" ? "bg-neon shadow-neon hover:scale-105 active:scale-95 text-black" : ""}
                ${workoutPhase === "running" ? "bg-red-500 shadow-[0_0_20px_#ef4444] hover:scale-105 active:scale-95 text-white" : ""}
                ${workoutPhase === "resting" ? "bg-slate-800 border-2 border-neon text-neon" : ""}
              `}
            >
              {workoutPhase === "idle" && (<><Play size={32} className="fill-black ml-1 mb-1" /><span className="text-[10px] font-bold tracking-widest leading-tight">INICIAR<br />SÉRIE</span></>)}
              {workoutPhase === "running" && (<><Check size={32} className="mb-1" /><span className="text-[10px] font-bold tracking-widest leading-tight">CONCLUIR<br />SÉRIE</span></>)}
              {workoutPhase === "resting" && (<><span className="text-4xl font-black font-mono leading-none">{fmt(timeLeft)}</span><span className="text-[8px] mt-1 font-bold tracking-widest text-gray-400">PULAR</span></>)}
            </button>
          )}
        </div>
      </div>

      {workoutPhase === "resting" ? (
        <div className="w-full max-w-sm glass-panel p-4 flex items-center justify-between border-b-2 border-yellow-400 bg-yellow-400/10 mt-4">
          <div className="flex items-center gap-3">
            <Timer size={22} className="text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-300">Coach IA:</p>
              <p className="font-bold text-yellow-400 tracking-widest text-sm">RECUPERAÇÃO — {fmt(timeLeft)}</p>
            </div>
          </div>
          <button onClick={toggleWorkout} className="text-gray-500 hover:text-neon transition-colors ml-2"><SkipForward size={20} /></button>
        </div>
      ) : !isExerciseDone ? (
        <div className="w-full max-w-sm glass-panel p-4 flex items-center gap-3 border-b-2 border-neon mt-4">
          <Activity size={22} className="text-neon flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Postura obrigatória:</p>
            <p className="font-semibold text-white text-sm leading-snug">{currentExercise.posture}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
