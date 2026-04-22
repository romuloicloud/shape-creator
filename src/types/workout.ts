export interface CadenceSpec { 
  down: number; 
  pause: number; 
  up: number; 
}

export interface Exercise {
  name: string; 
  sets: number; 
  reps: string;
  cadence: CadenceSpec; 
  rest: number; 
  posture: string;
}

export interface WorkoutProtocol {
  id: string; 
  label: string; 
  name: string;
  focus: string; 
  priority: boolean; 
  exercises: Exercise[];
}

export const WORKOUTS: WorkoutProtocol[] = [
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

export interface CardioPhase {
  name: string; // "Aquecimento", "Sprint", "Recuperação", etc.
  durationMinutes: number;
  intensityZone: string; // "Z1", "Z2", "Z4", "Z5"
  description: string;
}

export interface CardioProtocol {
  method: string; // "HIIT", "LISS", etc.
  totalDuration: number;
  frequencySemanal: number;
  focus: string; // "Queima", "Endurance"
  phases: CardioPhase[];
}
