"use client";

import { useState, useEffect, useRef } from "react";
import { User, Dumbbell, Camera, Activity, Zap, LogOut } from "lucide-react";
import { supabase, estimateMacros, calcBmi } from "@/lib/supabase";
import type { Profile, DailyMacros } from "@/lib/supabase";
import { WorkoutProtocol, CardioProtocol } from "@/types/workout";
import { playTick, playTransitionTick, playBeep, initAudioContext } from "@/lib/audio-player";

import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { SetupScanner } from "@/components/SetupScanner";
import { Dashboard } from "@/components/Dashboard";
import { WorkoutPlayer } from "@/components/WorkoutPlayer";
import { CardioDashboard } from "@/components/CardioDashboard";
import { CardioPlayer } from "@/components/CardioPlayer";

type AppStage = "loading" | "auth" | "onboarding" | "setup" | "dashboard" | "cardio";

export default function Home() {
  const [appStage, setAppStage] = useState<AppStage>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [macros, setMacros] = useState<DailyMacros | null>(null);
  
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  
  const [aiProtocols, setAiProtocols] = useState<WorkoutProtocol[] | null>(null);
  const [aiCardioProtocol, setAiCardioProtocol] = useState<CardioProtocol | null>(null);
  const [aiDiagnostico, setAiDiagnostico] = useState<any>(null);
  
  const [activeWorkout, setActiveWorkout] = useState<WorkoutProtocol | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [workoutPhase, setWorkoutPhase] = useState<"idle" | "running" | "resting">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [cadenceState, setCadenceState] = useState<{ phase: "down" | "pause" | "up", timer: number }>({ phase: "down", timer: 0 });
  
  const [isCardioPlayerOpen, setIsCardioPlayerOpen] = useState(false);

  const wakeLock = useRef<any>(null);
  const restEndTimeRef = useRef<number>(0);
  const lastTickPlayedRef = useRef<number>(0);

  // Background robustness
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.warn("Wake Lock fail:", err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      try { await wakeLock.current.release(); } catch (err) {}
      wakeLock.current = null;
    }
  };

  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'visible' && activeWorkout) requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [activeWorkout]);

  useEffect(() => {
    if (activeWorkout) requestWakeLock();
    else releaseWakeLock();
  }, [activeWorkout]);

  // Auth Init via Iron Session (BFF)
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.id) {
          if (data.accessToken && data.refreshToken) {
            supabase.auth.setSession({ access_token: data.accessToken, refresh_token: data.refreshToken });
          }
          setUserId(data.user.id);
          loadUserData(data.user.id);
        } else {
          setAppStage("auth");
        }
      })
      .catch(() => setAppStage("auth"));
  }, []);

  async function loadUserData(uid: string) {
    // Para escalabilidade, o carregamento idealmente vem de uma Rota API segura. Aqui mantemos o RLS base do banco localmente.
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (!prof) { setAppStage("onboarding"); return; }
    setProfile(prof);

    const { data: photos } = await supabase.from("user_photos").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).single();
    if (!photos) { setAppStage("setup"); return; }

    const today = new Date().toISOString().split("T")[0];
    const { data: m } = await supabase.from("daily_macros").select("*").eq("user_id", uid).eq("date", today).single();
    setMacros(m ?? estimateMacros(prof));
    
    // Auto-load AI Protocol if it exists in the database
    const { data: diagRows } = await supabase.from("diagnosticos").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(1);
    if (diagRows && diagRows.length > 0) {
      const diag = diagRows[0];
      if (diag.metadata) {
        setAiDiagnostico(diag.metadata);
        if (diag.metadata.protocolos) {
          setAiProtocols(diag.metadata.protocolos);
          setAnalysisDone(true);
        }
        if (diag.metadata.cardioProtocol) {
          setAiCardioProtocol(diag.metadata.cardioProtocol);
        }
      }
    }

    setAppStage("dashboard");
  }

  // Auth Handling
  async function handleLogin(email: string, pass: string) {
    setAuthError(""); setAuthLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    setAuthLoading(false);

    if (!res.ok) {
      setAuthError(data.error || "Erro no login");
      return;
    }
    if (data.accessToken && data.refreshToken) {
      supabase.auth.setSession({ access_token: data.accessToken, refresh_token: data.refreshToken });
    }
    
    setUserId(data.user_id);
    loadUserData(data.user_id);
  }
  
  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserId(null);
    setAppStage("auth");
  }

  // Onboarding
  async function submitOnboarding(age: string, height: string, weight: string, goal: string) {
    if (!userId) return;
    setOnboardingLoading(true);
    const prof: Profile = {
      id: userId,
      age: parseInt(age),
      height_cm: parseFloat(height),
      weight_kg: parseFloat(weight),
      goal_weight: parseFloat(goal),
    };
    await supabase.from("profiles").upsert(prof);
    setProfile(prof);
    setMacros(estimateMacros(prof));
    setOnboardingLoading(false);
    setAppStage("setup");
  }

  // Setup / Scanner
  async function startAnalysis(photoFiles: {frente: File|null, costas: File|null, ladoE: File|null, ladoD: File|null}) {
    if (!userId) return;
    setIsProcessing(true);
    const ts = Date.now();
    const paths: Record<string, string> = {};

    for (const key of Object.keys(photoFiles)) {
      const file = photoFiles[key as keyof typeof photoFiles];
      if (!file) continue;
      const path = `${userId}/${ts}/${key}.jpg`;
      await supabase.storage.from("user-photos").upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
      paths[key] = path;
    }

    await supabase.from("user_photos").insert({
      user_id: userId, frente: paths.frente, costas: paths.costas, lado_esq: paths.ladoE, lado_dir: paths.ladoD,
    });
    
    // Disparo para o Agente de IA (BFF)
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths })
      });
      const result = await res.json();
      if (res.ok) {
        setAiProtocols(result.protocolos);
        setAiDiagnostico(result.diagnostico);
        if (result.cardioProtocol) setAiCardioProtocol(result.cardioProtocol);
      } else {
        alert("Ops! Detecção falhou: " + (result.error || "Erro na API do Gemini. Verifique sua chave API."));
      }
    } catch (err) {
      console.error(err);
      alert("Erro fatal ao invocar Agente de IA.");
    }
    
    setIsProcessing(false);
    setAnalysisDone(true);
  }

  function finishSetup() {
    setAnalysisDone(false);
    setAppStage("dashboard");
  }

  // Workout state engine
  const currentExercise = activeWorkout?.exercises[currentExerciseIdx] ?? null;
  const totalSets = currentExercise?.sets ?? 4;
  const totalExercises = activeWorkout?.exercises.length ?? 0;
  const isExerciseDone = currentSet > totalSets;
  const isLastExercise = currentExerciseIdx >= totalExercises - 1;

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (workoutPhase === "resting") {
      t = setInterval(() => {
        const remaining = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
        if (remaining > 0) {
          if (remaining <= 4 && lastTickPlayedRef.current !== remaining) {
            playTick(); lastTickPlayedRef.current = remaining;
          }
          setTimeLeft((p) => p !== remaining ? remaining : p);
        } else {
          if (lastTickPlayedRef.current !== -1) {
            lastTickPlayedRef.current = -1;
            playBeep();
            setWorkoutPhase("idle");
            setCurrentSet((p) => p + 1);
            setTimeLeft(0);
          }
        }
      }, 250);
    } else if (workoutPhase === "running" && currentExercise) {
      t = setInterval(() => {
        setCadenceState((prev) => {
          if (prev.timer > 1) { playTick(); return { ...prev, timer: prev.timer - 1 }; }
          let nextPhase: "down" | "pause" | "up" = "down";
          let nextTime = 0;
          if (prev.phase === "down") {
            if (currentExercise.cadence.pause > 0) { nextPhase = "pause"; nextTime = currentExercise.cadence.pause; } 
            else { nextPhase = "up"; nextTime = currentExercise.cadence.up; }
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

  function openWorkout(w: WorkoutProtocol) {
    setActiveWorkout(w); setCurrentExerciseIdx(0); setCurrentSet(1); setWorkoutPhase("idle");
    setTimeLeft(w.exercises[0].rest);
  }

  function toggleWorkout() {
    if (!currentExercise) return;
    initAudioContext();
    
    if (workoutPhase === "idle") {
      setCadenceState({ phase: "down", timer: currentExercise?.cadence.down ?? 3 });
      setWorkoutPhase("running");
    } else if (workoutPhase === "running") {
      const rest = currentExercise?.rest ?? 60;
      restEndTimeRef.current = Date.now() + rest * 1000;
      setTimeLeft(rest);
      setWorkoutPhase("resting");
    } else if (workoutPhase === "resting") {
      lastTickPlayedRef.current = -1;
      setWorkoutPhase("idle");
      setCurrentSet((p) => p + 1);
      setTimeLeft(0);
    }
  }

  function jumpToExercise(idx: number) {
    if (idx === currentExerciseIdx) return;
    setCurrentExerciseIdx(idx);
    setCurrentSet(1);
    setWorkoutPhase("idle");
    setTimeLeft(0);
    setCadenceState({ phase: "down", timer: 0 });
    lastTickPlayedRef.current = -1;
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

  if (appStage === "loading") return <LoadingScreen />;
  if (appStage === "auth") return <AuthScreen authError={authError} authLoading={authLoading} handleLogin={handleLogin} />;
  if (appStage === "onboarding") return <OnboardingScreen onboardingLoading={onboardingLoading} submitOnboarding={submitOnboarding} />;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center pb-24 overflow-x-hidden pt-8 px-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-1/2 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />

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

      {appStage === "setup" && !activeWorkout && (
        <SetupScanner
          profile={profile}
          isProcessing={isProcessing}
          analysisDone={analysisDone}
          startAnalysis={startAnalysis}
          finishSetup={finishSetup}
        />
      )}

      {appStage === "dashboard" && !activeWorkout && (
        <Dashboard
          profile={profile}
          displayMacros={macros ?? (profile ? estimateMacros(profile) : null)}
          bmi={profile ? calcBmi(profile) : "—"}
          openWorkout={openWorkout}
          aiProtocols={aiProtocols}
          aiDiagnostico={aiDiagnostico}
        />
      )}

      {activeWorkout && (
        <WorkoutPlayer
          activeWorkout={activeWorkout}
          currentExerciseIdx={currentExerciseIdx}
          currentExercise={currentExercise}
          totalExercises={totalExercises}
          currentSet={currentSet}
          totalSets={totalSets}
          isExerciseDone={isExerciseDone}
          isLastExercise={isLastExercise}
          workoutPhase={workoutPhase}
          cadenceState={cadenceState}
          timeLeft={timeLeft}
          fmt={fmt}
          setActiveWorkout={setActiveWorkout}
          goToNextExercise={goToNextExercise}
          toggleWorkout={toggleWorkout}
          jumpToExercise={jumpToExercise}
        />
      )}

      {appStage === "cardio" && !activeWorkout && !isCardioPlayerOpen && (
        <CardioDashboard 
          profile={profile}
          cardioProtocol={aiCardioProtocol}
          openCardioPlayer={() => setIsCardioPlayerOpen(true)}
        />
      )}

      {isCardioPlayerOpen && aiCardioProtocol && (
        <CardioPlayer 
          cardioProtocol={aiCardioProtocol}
          onClose={() => setIsCardioPlayerOpen(false)}
        />
      )}

      {!activeWorkout && !isCardioPlayerOpen && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-panel p-2 flex justify-between items-center rounded-2xl z-50">
          <button className="p-3 rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><User size={24} /></button>
          <button onClick={() => setAppStage("dashboard")} className={`p-3 rounded-xl transition-colors ${appStage === "dashboard" ? "bg-white/10 text-white" : "text-gray-400"}`}><Dumbbell size={24} /></button>
          <button onClick={() => setAppStage("setup")} className="p-3 rounded-xl text-gray-400 hover:text-white transition-colors"><Camera size={24} /></button>
          <button onClick={() => setAppStage("cardio")} className={`p-3 rounded-xl transition-colors ${appStage === "cardio" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}><Activity size={24} /></button>
        </nav>
      )}
    </main>
  );
}
