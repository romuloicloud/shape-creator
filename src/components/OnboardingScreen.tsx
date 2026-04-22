import { useState } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";

export function OnboardingScreen({
  onboardingLoading,
  submitOnboarding,
}: {
  onboardingLoading: boolean;
  submitOnboarding: (name: string, age: string, height: string, weight: string, goal: string) => void;
}) {
  const [fName, setFName] = useState("");
  const [fAge, setFAge] = useState("");
  const [fHeight, setFHeight] = useState("");
  const [fWeight, setFWeight] = useState("");
  const [fGoal, setFGoal] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitOnboarding(fName, fAge, fHeight, fWeight, fGoal);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />
      <form onSubmit={onSubmit} className="glass-panel p-8 w-full max-w-sm flex flex-col gap-5 z-10">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400 tracking-[3px] uppercase mb-1">Setup Inicial</p>
          <h1 className="text-xl font-extrabold text-white tracking-widest">SEU PERFIL</h1>
          <p className="text-xs text-gray-400 mt-1">Dados usados pelo Motor de IA para calibrar seu plano</p>
        </div>

        {[
          { label: "NOME (CÓDIGO DE GUERRA)", placeholder: "ex: Rômulo", value: fName, setter: setFName, type: "text", unit: "" },
          { label: "IDADE", placeholder: "ex: 32", value: fAge, setter: setFAge, type: "number", unit: "anos" },
          { label: "ALTURA", placeholder: "ex: 178", value: fHeight, setter: setFHeight, type: "number", unit: "cm" },
          { label: "PESO ATUAL", placeholder: "ex: 82.5", value: fWeight, setter: setFWeight, type: "number", unit: "kg" },
          { label: "PESO OBJETIVO", placeholder: "ex: 75", value: fGoal, setter: setFGoal, type: "number", unit: "kg" },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-[10px] font-bold tracking-[3px] text-gray-400 mb-1 block">{field.label}</label>
            <div className="flex items-center gap-2">
              <input
                type={field.type} placeholder={field.placeholder} value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                step="0.1" min="1" required
                className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon/60 transition-colors"
              />
              <span className="text-xs text-gray-500 w-8">{field.unit}</span>
            </div>
          </div>
        ))}

        <button
          type="submit" disabled={onboardingLoading}
          className="mt-2 py-4 bg-neon text-black font-extrabold rounded-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {onboardingLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
          {onboardingLoading ? "PROCESSANDO..." : "CALIBRAR MOTOR DE IA"}
        </button>
      </form>
    </div>
  );
}
