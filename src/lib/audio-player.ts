export let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playTone(freq: number, type: OscillatorType, durationMs: number, vol = 0.1) {
  if (typeof window === "undefined") return;
  initAudioContext();
  if (!audioCtx) return;
  
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

export function playTick() { 
  playTone(500, "sine", 100, 0.1); 
}

export function playTransitionTick() { 
  playTone(800, "sine", 100, 0.2); 
}

export function playBeep() { 
  playTone(440, "square", 300, 0.3); 
}
