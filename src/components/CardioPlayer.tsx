import { useState, useEffect, useRef } from "react";
import { ChevronLeft, CheckCircle2, Play, Pause, Activity, FastForward } from "lucide-react";
import { CardioProtocol } from "@/types/workout";
import { playTick, playBeep, playTransitionTick } from "@/lib/audio-player";

export function CardioPlayer({
  cardioProtocol,
  onClose
}: {
  cardioProtocol: CardioProtocol;
  onClose: () => void;
}) {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(cardioProtocol.phases[0].durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const totalPhases = cardioProtocol.phases.length;
  const currentPhase = cardioProtocol.phases[currentPhaseIdx];
  const endTimeRef = useRef(0);
  const lastTickPlayedRef = useRef(-1);

  // Formatting seconds to MM:SS
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isRunning && !isFinished) {
      t = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        
        if (remaining > 0) {
          if (remaining <= 3 && lastTickPlayedRef.current !== remaining) {
            playTransitionTick();
            lastTickPlayedRef.current = remaining;
          }
          setPhaseTimeLeft(remaining);
        } else {
          // Fase Concluída
          if (currentPhaseIdx < totalPhases - 1) {
            playBeep(); // Beep sonoro de troca
            const nextIdx = currentPhaseIdx + 1;
            const nextTime = cardioProtocol.phases[nextIdx].durationMinutes * 60;
            setCurrentPhaseIdx(nextIdx);
            setPhaseTimeLeft(nextTime);
            endTimeRef.current = Date.now() + nextTime * 1000;
            lastTickPlayedRef.current = -1;
          } else {
            // Acabou o treino
            playBeep();
            setIsRunning(false);
            setIsFinished(true);
            setPhaseTimeLeft(0);
          }
        }
      }, 250);
    }
    return () => clearInterval(t);
  }, [isRunning, isFinished, currentPhaseIdx, totalPhases, cardioProtocol.phases]);

  function togglePlay() {
    if (isFinished) return;
    if (!isRunning) {
      endTimeRef.current = Date.now() + phaseTimeLeft * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false); // Pausa
    }
  }

  function skipPhase() {
    if (isFinished) return;
    if (currentPhaseIdx < totalPhases - 1) {
      playBeep();
      const nextIdx = currentPhaseIdx + 1;
      const nextTime = cardioProtocol.phases[nextIdx].durationMinutes * 60;
      setCurrentPhaseIdx(nextIdx);
      setPhaseTimeLeft(nextTime);
      if (isRunning) endTimeRef.current = Date.now() + nextTime * 1000;
    } else {
      setIsFinished(true);
      setIsRunning(false);
      setPhaseTimeLeft(0);
    }
  }

  // Helper colors baseadas na Zona
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'Z1': return "text-blue-400 border-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.3)]";
      case 'Z2': return "text-green-400 border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.3)]";
      case 'Z3': return "text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]";
      case 'Z4': return "text-orange-500 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4)]";
      case 'Z5': return "text-red-500 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.5)]";
      default: return "text-neon border-neon/50 shadow-neon";
    }
  };

  const ringColor = isFinished ? "text-green-500 border-green-500 shadow-[0_0_30px_#22c55e]" : getZoneColor(currentPhase.intensityZone);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center px-6 py-8 pb-10 animate-in fade-in duration-300 overflow-y-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8 mt-2">
        <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:text-red-500 transition-colors flex-shrink-0">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-end">
          <h2 className="text-sm font-bold font-mono tracking-widest text-red-500 uppercase">{cardioProtocol.method}</h2>
          <span className="text-[10px] text-gray-400 tracking-widest font-mono">FASE {currentPhaseIdx + 1} / {totalPhases}</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center text-center flex-1">
        {isFinished ? (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <CheckCircle2 size={100} className="text-green-500 drop-shadow-[0_0_20px_#22c55e] mb-6" />
            <h1 className="text-4xl font-black text-white mb-2 uppercase">Endurance Concluído!</h1>
            <p className="text-gray-400 text-sm mb-10">O motor cardiovascular operou com sucesso sob a via metabólica ótima.</p>
            
            <button onClick={onClose} className="w-full py-5 rounded-full font-black text-sm tracking-widest bg-green-500 text-black shadow-[0_0_20px_#22c55e] hover:scale-105 active:scale-95 transition-all">
              RETORNAR AO QG
            </button>
          </div>
        ) : (
          <>
            {/* Meta Focus */}
            <div className="w-full glass-panel p-4 border border-white/5 flex flex-col mb-8 relative overflow-hidden text-left">
              <span className="absolute -left-2 top-0 bottom-0 w-2 bg-red-500/50" />
              <h3 className="text-white font-bold text-lg leading-tight mb-1">{currentPhase.name}</h3>
              <p className="text-xs text-gray-400">{currentPhase.description}</p>
            </div>

            {/* Timer Central Monumental */}
            <div className={`relative flex items-center justify-center mb-10 transition-all duration-500 ${isRunning ? "scale-105" : "scale-100 opacity-80"}`}>
              <div className={`w-64 h-64 border-4 rounded-full flex flex-col items-center justify-center transition-all bg-black/40 backdrop-blur-xl ${ringColor}`}>
                <Activity size={32} className={`mb-2 opacity-50 ${isRunning ? "animate-bounce" : ""}`} />
                <span className="text-6xl font-black font-mono tracking-tighter leading-none mb-1">
                  {fmt(phaseTimeLeft)}
                </span>
                <span className="text-xs font-bold tracking-widest uppercase opacity-70">
                  {currentPhase.intensityZone} - TARGET
                </span>
              </div>
              
              {/* Spinning border effect on run */}
              {isRunning && (
                <div className="absolute w-[270px] h-[270px] border-[2px] border-dashed rounded-full animate-[spin_5s_linear_infinite]" style={{ borderColor: 'inherit' }} />
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-auto">
              <button onClick={togglePlay} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] ${isRunning ? "bg-red-500/20 text-red-500 border-2 border-red-500 hover:bg-red-500/30" : "bg-red-500 text-white hover:scale-105"}`}>
                {isRunning ? <Pause size={32} className="fill-current" /> : <Play size={36} className="fill-current ml-2" />}
              </button>
              
              <button onClick={skipPhase} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                <FastForward size={24} />
              </button>
            </div>
            
            <p className="mt-6 text-[10px] uppercase font-mono tracking-widest text-gray-500">
              {isRunning ? "MANTENHA A CADÊNCIA RESPIRATÓRIA" : "EM ESPERA. APERTE PLAY PARA ENTRAR NA ZONA."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
