import { useState } from "react";
import { Activity, Camera, Dumbbell, Upload, CheckCircle2, Loader2, BrainCircuit } from "lucide-react";

export function SetupScanner({
  profile,
  isProcessing,
  analysisDone,
  startAnalysis,
  finishSetup,
}: {
  profile: any;
  isProcessing: boolean;
  analysisDone: boolean;
  startAnalysis: (photoFiles: any) => void;
  finishSetup: () => void;
}) {
  const [photos, setPhotos] = useState<{ frente: string | null; costas: string | null; ladoE: string | null; ladoD: string | null }>
    ({ frente: null, costas: null, ladoE: null, ladoD: null });
  const [photoFiles, setPhotoFiles] = useState<{ frente: File | null; costas: File | null; ladoE: File | null; ladoD: File | null }>
    ({ frente: null, costas: null, ladoE: null, ladoD: null });

  const uploadSlots = [
    { id: "frente", label: "FRENTE" },
    { id: "costas", label: "COSTAS" },
    { id: "ladoE", label: "LADO ESQ" },
    { id: "ladoD", label: "LADO DIR" },
  ];

  function handleUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotos((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
    setPhotoFiles((prev) => ({ ...prev, [id]: file }));
  }

  const allPhotosUploaded = Object.values(photos).every((p) => p !== null);

  return (
    <div className="relative flex-1 w-full flex flex-col items-center justify-center mt-8 z-10">
      {!isProcessing && !analysisDone && (
        <div className="relative w-full flex flex-col items-center">
          <div className="absolute left-2 top-0 xl:left-1/4 glass-panel px-3 py-2 flex items-center gap-2 animate-[bounce_4s_infinite] pointer-events-none z-20">
            <Activity size={16} className="text-red-400" />
            <span className="text-xs font-bold">120 bpm</span>
          </div>
          <div className="absolute right-2 top-10 xl:right-1/4 glass-panel px-3 py-2 flex items-center gap-2 animate-[bounce_5s_infinite] pointer-events-none z-20">
            <Dumbbell size={16} className="text-neon" />
            <span className="text-xs font-bold">Modo: SETUP</span>
          </div>
          <div className="relative w-full max-w-sm flex flex-col items-center mt-6">
            <div className="absolute bottom-0 w-3/4 h-12 bg-neon/20 rounded-[100%] blur-md pointer-events-none" />
            <div className="w-full glass-panel p-6 neon-glow z-10">
              <div className="text-center mb-6">
                <Camera size={32} className="mx-auto mb-2 text-neon" />
                <p className="text-sm font-mono text-white font-bold">Mapeamento Fisiológico</p>
                <p className="text-xs text-gray-400 mt-1">Carregue as 4 posições para liberar o escaneamento.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {uploadSlots.map((slot) => (
                  <label key={slot.id} className="relative flex flex-col items-center justify-center h-28 glass-panel border border-neon/30 hover:border-neon cursor-pointer overflow-hidden transition-all duration-300">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(slot.id, e)} />
                    {photos[slot.id as keyof typeof photos] ? (
                      <>
                        <img src={photos[slot.id as keyof typeof photos]!} alt={slot.label} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-neon drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center opacity-70">
                        <Upload size={20} className="mb-2 text-white" />
                        <span className="text-xs font-bold tracking-wider">{slot.label}</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="relative w-full max-w-sm glass-panel p-8 flex flex-col items-center border border-neon neon-glow animate-pulse overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-neon shadow-[0_0_20px_#00f0ff] animate-[bounce_2s_infinite]" />
          <BrainCircuit size={64} className="text-neon mb-6 animate-pulse" />
          <h2 className="text-xl font-bold font-mono tracking-widest text-center">ANALISANDO MATRIZ...</h2>
          <p className="text-sm text-gray-400 mt-2 text-center">Cruzando dados de assimetria, postura e proporção muscular.</p>
          <div className="mt-6 flex items-center gap-2">
            <Loader2 size={16} className="text-neon animate-spin" />
            <span className="text-xs font-bold tracking-widest text-neon">SALVANDO NO BANCO</span>
          </div>
        </div>
      )}

      {analysisDone && (
        <div className="relative w-full max-w-sm glass-panel p-8 border border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.2)] flex flex-col items-center text-center">
          <CheckCircle2 size={64} className="text-green-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">ESCANEAMENTO CONCLUÍDO</h2>
          <p className="text-sm text-gray-300 mb-6">Fotos salvas. Motor Biomecânico calibrado.</p>
          <div className="bg-black/40 p-4 rounded-xl border border-gray-700 w-full mb-4">
            <p className="text-xs text-gray-400 font-mono mb-1 text-left">
              &gt;&gt; {profile?.weight_kg}kg · {profile?.height_cm}cm · {profile?.age} anos
            </p>
            <p className="font-bold text-sm text-neon text-left flex items-center gap-2">
              <Activity size={16} /> SINCRONIA METABÓLICA ESTABELECIDA
            </p>
          </div>
          <button onClick={finishSetup} className="w-full py-4 bg-neon text-black font-extrabold rounded-xl hover:scale-105 transition-transform">
            GERAR PLANO ADAPTATIVO
          </button>
        </div>
      )}

      {!isProcessing && !analysisDone && (
        <div className="w-full z-10 flex flex-col gap-4 mt-8">
          <button
            onClick={() => startAnalysis(photoFiles)} disabled={!allPhotosUploaded}
            className={`w-full py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              allPhotosUploaded
                ? "bg-neon text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_var(--neon-cyan-glow)]"
                : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/10"
            }`}
          >
            <BrainCircuit className={allPhotosUploaded ? "text-black" : "text-gray-500"} />
            {allPhotosUploaded ? "INICIAR ESCANEAMENTO IA" : "AGUARDANDO FOTOGRAFIAS"}
          </button>
        </div>
      )}
    </div>
  );
}
