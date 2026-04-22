import { useState } from "react";

export function AuthScreen({
  authError,
  authLoading,
  handleLogin,
}: {
  authError: string;
  authLoading: boolean;
  handleLogin: (email: string, pass: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />
      <form onSubmit={onSubmit} className="glass-panel p-8 w-full max-w-sm flex flex-col gap-4 z-10">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400 tracking-[4px] uppercase mb-1">Shape Criator</p>
          <h1 className="text-2xl font-extrabold text-neon tracking-widest">ACESSO</h1>
        </div>
        <input
          type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required autoFocus
          className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon/60 transition-colors"
        />
        <input
          type="password" placeholder="senha" value={password} onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon/60 transition-colors"
        />
        {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
        <button
          type="submit" disabled={authLoading}
          className="py-4 bg-neon text-black font-extrabold rounded-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
        >
          {authLoading ? "ENTRANDO..." : "ENTRAR"}
        </button>
      </form>
    </div>
  );
}
