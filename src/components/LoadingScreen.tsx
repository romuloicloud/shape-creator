import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <img src="/logo.png" alt="Shape Creator Logo" className="w-20 h-20 object-contain shadow-neon rounded-full" />
      <div className="flex items-center gap-2 text-neon">
        <Loader2 size={18} className="animate-spin" />
        <span className="font-mono text-xs tracking-widest uppercase">Initializing...</span>
      </div>
    </div>
  );
}
