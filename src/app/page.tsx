"use client";

import { useState, useEffect, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity, Camera, Dumbbell, User, Zap, Upload, CheckCircle2,
  Loader2, BrainCircuit, Target, ArrowRight, Flame, ChevronLeft,
  Play, Timer, Check, SkipForward, LogOut,
} from "lucide-react";
import { supabase, estimateMacros, calcBmi } from "@/lib/supabase";
import type { Profile, DailyMacros } from "@/lib/supabase";

// ── Workout Types & Data ──────────────────────────────────────────────────────

interface CadenceSpec { down: number; pause: number; up: number }
interface Exercise {
  name: string; sets: number; reps: string;
  cadence: CadenceSpec; rest: number; posture: string;
}
interface WorkoutProtocol {
  id: string; label: string; name: string;
  focus: string; priority: boolean; exercises: Exercise[];
}

const WORKOUTS: WorkoutProtocol[] = [
  {
    id: "push", label: "TREINO A", name: "Push (Peito, Ombro, Tríceps)",
    focus: "Expansão Torácica", priority: false,
    exercises: [
      { name: "Supino Inclinado", sets: 4, reps: "8 a 10", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Escápulas retraídas e deprimidas, arco natural" },
      { name: "Desenvolvimento Arnold", sets: 4, reps: "10 a 12", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Cotovelos alinhados, core ativado, sem hiperextensão" },
      { name: "Crucifixo com Halteres", sets: 3, reps: "12 a 15", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Leve flexão nos cotovelos, peito aberto no ponto mais baixo" },
      { name: "Elevação Lateral", sets: 3, reps: "12 a 15", cadence: { down: 2, pause: 0, up: 1 }, rest: 60, posture: "Cotovelos levemente flexionados, sem balanço de tronco" },
      { name: "Tríceps Corda", sets: 3, reps: "12 a 15", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Cotovelos fixos ao tronco, extensão total na descida" },
    ],
  },
  {
    id: "pull", label: "TREINO B", name: "Pull (Costas e Bíceps)",
    focus: "Retração escapular máxima", priority: false,
    exercises: [
      { name: "Puxada Frontal", sets: 4, reps: "8 a 10", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Retração escapular máxima no topo, descida controlada" },
      { name: "Remada Curvada", sets: 4, reps: "8 a 10", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Coluna neutra, joelhos levemente flexionados" },
      { name: "Remada Unilateral", sets: 3, reps: "10 a 12", cadence: { down: 3, pause: 1, up: 1 }, rest: 60, posture: "Quadril fixo, rotação zero, cotovelo passa o tronco" },
      { name: "Rosca Direta", sets: 3, reps: "10 a 12", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Cotovelos fixos ao tronco, supinação total no topo" },
      { name: "Rosca Martelo", sets: 3, reps: "12 a 15", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Polegar apontado para cima, sem balanço de ombros" },
    ],
  },
  {
    id: "legs", label: "TREINO C", name: "Legs (Foco em Posteriores)",
    focus: "Alinhamento pélvico e simetria de pernas", priority: true,
    exercises: [
      { name: "Mesa Flexora", sets: 4, reps: "12 a 15", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Quadril pressionado no banco, amplitude total" },
      { name: "Terra Romeno", sets: 4, reps: "8 a 10", cadence: { down: 3, pause: 2, up: 1 }, rest: 90, posture: "Barra próxima às pernas, coluna reta, sensação de alongamento" },
      { name: "Cadeira Extensora", sets: 3, reps: "12 a 15", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Contração máxima no topo, descida lenta e controlada" },
      { name: "Agachamento Sumô", sets: 3, reps: "10 a 12", cadence: { down: 3, pause: 1, up: 1 }, rest: 90, posture: "Joelhos apontando para os pés, quadril em retroversão leve" },
      { name: "Panturrilha em Pé", sets: 3, reps: "15 a 20", cadence: { down: 2, pause: 1, up: 1 }, rest: 60, posture: "Amplitude máxima em cada repetição, tornozelo neutro" },
    ],
  },
];

// ── Audio Helper ─────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function playTone(freq: number, type: OscillatorType, durationMs: number, vol = 0.1) {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + durationMs / 1000);
}

function playTick() { playTone(500, "sine", 100, 0.1); }
function playTransitionTick() { playTone(800, "sine", 100, 0.2); }
function playBeep() { playTone(440, "square", 300, 0.3); }

// ── App Stage ────────────────────────────────────────────────────────────────

type AppStage = "loading" | "auth" | "onboarding" | "setup" | "dashboard";

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Auth & profile ──────────────────────────────────────────────────────
  const [appStage, setAppStage] = useState<AppStage>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [macros, setMacros] = useState<DailyMacros | null>(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Onboarding form ────────────────────────────────────────────────────
  const [fAge, setFAge] = useState("");
  const [fHeight, setFHeight] = useState("");
  const [fWeight, setFWeight] = useState("");
  const [fGoal, setFGoal] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // ── Setup / scan ────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<{ frente: string | null; costas: string | null; ladoE: string | null; ladoD: string | null }>
    ({ frente: null, costas: null, ladoE: null, ladoD: null });
  const [photoFiles, setPhotoFiles] = useState<{ frente: File | null; costas: File | null; ladoE: File | null; ladoD: File | null }>
    ({ frente: null, costas: null, ladoE: null, ladoD: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  // ── Workout ─────────────────────────────────────────────────────────────
  const [activeWorkout, setActiveWorkout] = useState<WorkoutProtocol | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [workoutPhase, setWorkoutPhase] = useState<"idle" | "running" | "resting">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [cadenceState, setCadenceState] = useState<{ phase: "down" | "pause" | "up", timer: number }>({ phase: "down", timer: 0 });

  // ── Background Robustness ───────────────────────────────────────────────
  const wakeLock = useRef<any>(null);
  const restEndTimeRef = useRef<number>(0);
  const lastTickPlayedRef = useRef<number>(0);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.warn("Wake Lock API não suportada ou bloqueada:", err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      try {
        await wakeLock.current.release();
      } catch (err) {}
      wakeLock.current = null;
    }
  };

  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'visible' && activeWorkout !== null) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [activeWorkout]);

  useEffect(() => {
    if (activeWorkout) requestWakeLock();
    else releaseWakeLock();
  }, [activeWorkout]);


  // Derived
  const currentExercise = activeWorkout?.exercises[currentExerciseIdx] ?? null;
  const totalSets = currentExercise?.sets ?? 4;
  const totalExercises = activeWorkout?.exercises.length ?? 0;
  const isExerciseDone = currentSet > totalSets;
  const isLastExercise = currentExerciseIdx >= totalExercises - 1;

  // ── Auth init ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        loadUserData(data.session.user.id);
      } else {
        setAppStage("auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) setAppStage("auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    const { data: prof } = await supabase
      .from("profiles").select("*").eq("id", userId).single();
    if (!prof) { setAppStage("onboarding"); return; }
    setProfile(prof);

    const { data: photos } = await supabase
      .from("user_photos").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).single();
    if (!photos) { setAppStage("setup"); return; }

    const today = new Date().toISOString().split("T")[0];
    const { data: m } = await supabase
      .from("daily_macros").select("*").eq("user_id", userId).eq("date", today).single();
    setMacros(m ?? estimateMacros(prof));
    setAppStage("dashboard");
  }

  // ── Auth actions ─────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); return; }
    const { data } = await supabase.auth.getSession();
    if (data.session) { setSession(data.session); loadUserData(data.session.user.id); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // ── Onboarding ───────────────────────────────────────────────────────────
  async function submitOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    setOnboardingLoading(true);
    const prof: Profile = {
      id: session.user.id,
      age: parseInt(fAge),
      height_cm: parseFloat(fHeight),
      weight_kg: parseFloat(fWeight),
      goal_weight: parseFloat(fGoal),
    };
    await supabase.from("profiles").upsert(prof);
    setProfile(prof);
    setMacros(estimateMacros(prof));
    setOnboardingLoading(false);
    setAppStage("setup");
  }

  // ── Photo upload + scan ──────────────────────────────────────────────────
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

  async function startAnalysis() {
    if (!session?.user || !allPhotosUploaded) return;
    setIsProcessing(true);

    // Upload photos to Storage
    const uid = session.user.id;
    const ts = Date.now();
    const paths: Record<string, string> = {};

    for (const slot of uploadSlots) {
      const file = photoFiles[slot.id as keyof typeof photoFiles];
      if (!file) continue;
      const path = `${uid}/${ts}/${slot.id}.jpg`;
      await supabase.storage.from("user-photos").upload(path, file, {
        contentType: file.type || "image/jpeg", upsert: true,
      });
      paths[slot.id] = path;
    }

    await supabase.from("user_photos").insert({
      user_id: uid,
      frente: paths.frente, costas: paths.costas,
      lado_esq: paths.ladoE, lado_dir: paths.ladoD,
    });

    setTimeout(() => { setIsProcessing(false); setAnalysisDone(true); }, 4000);
  }

  function finishSetup() {
    setAnalysisDone(false);
    setAppStage("dashboard");
  }

  // ── Workout Loop (Rest & Cadence) ─────────────────────────────────────────
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (workoutPhase === "resting") {
      t = setInterval(() => {
        const remaining = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
        
        if (remaining > 0) {
          if (remaining <= 4 && lastTickPlayedRef.current !== remaining) {
            playTick();
            lastTickPlayedRef.current = remaining;
          }
          setTimeLeft((p) => p !== remaining ? remaining : p);
        } else {
          if (lastTickPlayedRef.current !== -1) {
            lastTickPlayedRef.current = -1; // Guard para não tocar o alarme múltiplas vezes
            playBeep();
            setWorkoutPhase("idle");
            setCurrentSet((p) => p + 1);
            setTimeLeft(0);
          }
        }
      }, 250); // Polling de alta frequência garante precisão na tela bloqueada
    } else if (workoutPhase === "running" && currentExercise) {
      t = setInterval(() => {
        setCadenceState((prev) => {
          if (prev.timer > 1) {
            playTick();
            return { ...prev, timer: prev.timer - 1 };
          }
          // Phase transition
          let nextPhase: "down" | "pause" | "up" = "down";
          let nextTime = 0;
          if (prev.phase === "down") {
            if (currentExercise.cadence.pause > 0) {
              nextPhase = "pause"; nextTime = currentExercise.cadence.pause;
            } else {
              nextPhase = "up"; nextTime = currentExercise.cadence.up;
            }
          } else if (prev.phase === "pause") {
            nextPhase = "up"; nextTime = currentExercise.cadence.up;
          } else if (prev.phase === "up") {
            nextPhase = "down"; nextTime = currentExercise.cadence.down;
          }
          
          playTransitionTick();
          return { phase: nextPhase, timer: nextTime > 0 ? nextTime : 1 };
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [workoutPhase, currentExercise]);

  // ── Workout helpers ───────────────────────────────────────────────────────
  function openWorkout(w: WorkoutProtocol) {
    setActiveWorkout(w); setCurrentExerciseIdx(0);
    setCurrentSet(1); setWorkoutPhase("idle");
    setTimeLeft(w.exercises[0].rest);
  }

  function toggleWorkout() {
    if (!currentExercise) return;
    
    // Init Audio Context on Interaction
    if (typeof window !== "undefined") {
      if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    if (workoutPhase === "idle") { 
      setWorkoutPhase("running"); 
      setCadenceState({ phase: "down", timer: currentExercise.cadence.down });
    }
    else if (workoutPhase === "running") { 
      setWorkoutPhase("resting"); 
      setTimeLeft(currentExercise.rest); 
      restEndTimeRef.current = Date.now() + currentExercise.rest * 1000;
      lastTickPlayedRef.current = 0;
    }
    else { 
      setWorkoutPhase("idle"); 
      setCurrentSet((p) => p + 1); 
    }
  }

  function goToNextExercise() {
    if (!activeWorkout) return;
    const next = currentExerciseIdx + 1;
    if (next < activeWorkout.exercises.length) {
      setCurrentExerciseIdx(next); setCurrentSet(1);
      setWorkoutPhase("idle"); setTimeLeft(activeWorkout.exercises[next].rest);
    } else { setActiveWorkout(null); }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (appStage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-neon animate-spin" />
      </div>
    );
  }

  // ── Render: Auth ──────────────────────────────────────────────────────────
  if (appStage === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />
        <form onSubmit={handleLogin} className="glass-panel p-8 w-full max-w-sm flex flex-col gap-4 z-10">
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

  // ── Render: Onboarding ────────────────────────────────────────────────────
  if (appStage === "onboarding") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />
        <form onSubmit={submitOnboarding} className="glass-panel p-8 w-full max-w-sm flex flex-col gap-5 z-10">
          <div className="text-center mb-2">
            <p className="text-xs text-gray-400 tracking-[3px] uppercase mb-1">Setup Inicial</p>
            <h1 className="text-xl font-extrabold text-white tracking-widest">SEU PERFIL</h1>
            <p className="text-xs text-gray-400 mt-1">Dados usados pelo Motor de IA para calibrar seu plano</p>
          </div>

          {[
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

  // ── Render: Setup (photo upload) + Active Workout ─────────────────────────
  const displayMacros = macros ?? (profile ? estimateMacros(profile) : null);
  const bmi = profile ? calcBmi(profile) : "—";

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center pb-24 overflow-x-hidden pt-8 px-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      {!activeWorkout && (
        <header className="w-full flex items-center justify-between z-10">
          <div>
            <p className="text-sm text-gray-400 font-medium tracking-wider">BEM-VINDO DE VOLTA,</p>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              COMANDANTE <span className="animate-pulse">✋</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass-panel px-3 py-2 flex items-center gap-1.5">
              <Zap size={14} className="text-neon" />
              <span className="font-bold text-xs">{profile?.weight_kg ?? "—"} kg</span>
            </div>
            <button onClick={handleSignOut} className="glass-panel p-2 text-gray-400 hover:text-neon transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </header>
      )}

      {/* ── Setup: photo upload ── */}
      {appStage === "setup" && !activeWorkout && (
        <div className="relative flex-1 w-full flex flex-col items-center justify-center mt-8 z-10">

          {!isProcessing && !analysisDone && (
            <div className="relative w-full flex flex-col items-center">
              <div className="absolute -left-2 top-0 xl:left-1/4 glass-panel px-3 py-2 flex items-center gap-2 animate-[bounce_4s_infinite] pointer-events-none z-20">
                <Activity size={16} className="text-red-400" />
                <span className="text-xs font-bold">120 bpm</span>
              </div>
              <div className="absolute -right-2 top-10 xl:right-1/4 glass-panel px-3 py-2 flex items-center gap-2 animate-[bounce_5s_infinite] pointer-events-none z-20">
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
                onClick={startAnalysis} disabled={!allPhotosUploaded}
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
      )}

      {/* ── Dashboard ── */}
      {appStage === "dashboard" && !activeWorkout && (
        <div className="w-full max-w-lg mt-8 z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="glass-panel p-5 border-t-2 border-t-neon mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-mono text-neon font-bold tracking-widest">LAUDO BIOMECÂNICO</h2>
              <span className="text-xs bg-neon/20 text-neon px-2 py-1 rounded">IMC: {bmi}</span>
            </div>
            <p className="text-sm text-gray-300">
              Foco Tático: Simetria e Recomposição Corporal. Cadeia posterior prioridade.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-400">Peso</p>
                <p className="font-bold">{profile?.weight_kg ?? "—"} kg</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-400">Calorias IA</p>
                <p className="font-bold flex justify-center items-center gap-1 text-orange-400">
                  <Flame size={14} /> {displayMacros?.calories ?? "—"}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-400">Proteína</p>
                <p className="font-bold">{displayMacros?.protein_g ?? "—"} g</p>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Target className="text-neon" /> PROTOCOLO DE TREINO
          </h3>

          <div className="flex flex-col gap-3">
            {WORKOUTS.map((workout) => (
              <button key={workout.id} onClick={() => openWorkout(workout)}
                className={`w-full text-left glass-panel p-4 flex items-center justify-between hover:border-neon/60 transition-all group ${workout.priority ? "neon-glow border border-neon" : ""}`}
              >
                <div>
                  <span className="text-xs text-neon font-bold">
                    {workout.label}{workout.priority ? " · PRIORIDADE" : ""}
                  </span>
                  <h4 className="font-bold text-white group-hover:text-neon">{workout.name}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Activity size={12} /> {workout.focus} · {workout.exercises.length} exercícios
                  </p>
                </div>
                <div className={`p-2 rounded-full transition-colors flex-shrink-0 ml-3 ${workout.priority ? "bg-neon text-black" : "bg-white/10 text-white group-hover:bg-neon group-hover:text-black"}`}>
                  <ArrowRight size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Workout ── */}
      {activeWorkout && currentExercise && (
        <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center px-6 py-8 pb-10 animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full flex items-center justify-between mb-4">
            <button onClick={() => setActiveWorkout(null)} className="bg-white/10 p-2 rounded-xl text-white hover:text-neon transition-colors flex-shrink-0">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-sm font-bold font-mono tracking-widest text-neon">{activeWorkout.label}</h2>
            <div className="flex gap-1 flex-shrink-0">
              {activeWorkout.exercises.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx < currentExerciseIdx ? "bg-green-400" : idx === currentExerciseIdx ? "bg-neon shadow-[0_0_8px_#00f0ff]" : "bg-slate-700"}`} />
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto flex gap-2 pb-2 mb-6 scrollbar-none">
            {activeWorkout.exercises.map((ex, idx) => (
              <span key={idx} className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${idx < currentExerciseIdx ? "bg-green-500/20 text-green-400 border-green-500/30" : idx === currentExerciseIdx ? "bg-neon text-black border-neon" : "bg-white/5 text-gray-500 border-white/10"}`}>
                {ex.name}
              </span>
            ))}
          </div>

          <div className="w-full max-w-sm flex flex-col items-center text-center flex-1">
            <div className="flex flex-col items-center gap-1 mb-6">
              <span className="bg-neon/10 text-neon px-4 py-1.5 rounded-full text-sm font-bold border border-neon/40">{currentExercise.name}</span>
              <p className="text-xs text-gray-500 font-mono tracking-widest">EXERCÍCIO {currentExerciseIdx + 1} / {totalExercises}</p>
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
      )}

      {/* Bottom Nav */}
      {!activeWorkout && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-panel p-2 flex justify-between items-center rounded-2xl z-50">
          <button className="p-3 rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><User size={24} /></button>
          <button className={`p-3 rounded-xl transition-colors ${appStage === "dashboard" ? "bg-white/10 text-white" : "text-gray-400"}`}><Dumbbell size={24} /></button>
          <button onClick={() => appStage === "dashboard" && setAppStage("setup")} className="p-3 rounded-xl text-gray-400 hover:text-white transition-colors"><Camera size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:text-white transition-colors"><Activity size={24} /></button>
        </nav>
      )}
    </main>
  );
}
