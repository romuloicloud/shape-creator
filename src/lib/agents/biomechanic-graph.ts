import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

export const GraphState = Annotation.Root({
  userId: Annotation<string>(),
  imageUrls: Annotation<{ frente?: string; costas?: string; ladoE?: string; ladoD?: string }>(),
  profileData: Annotation<{ age: number; weight: number; target: number }>(),
  
  // Output nodes
  diagnostico: Annotation<{ cifose_grau: number; escoliose_desvio: number; detalhes: string; biotipo: string; tempo_ideal_treino_minutos: string; }>(),
  protocolos: Annotation<any[]>(),
  cardioProtocol: Annotation<any>(),
});

// Using gemini-flash-latest to stay compatible with the newest API endpoints
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  temperature: 0.1,
  apiKey: process.env.GEMINI_API_KEY || "dummy_for_build",
});

async function diagnosticNode(state: typeof GraphState.State) {
  const content: any[] = [];
  content.push({ 
    type: "text", 
    text: "Você é um clínico biomecânico esportivo de elite de nível Olímpico. Analise estas fotos anatômicas (algumas podem estar ausentes) e formule um diagnóstico biomecânico, inferindo grau aproximado de hipercifose e escoliose. Seja realista e conservador. Você não inventará anomalias se o corpo estiver apto. O resultado DEVE SER ESTRITAMENTE o JSON estruturado." 
  });
  
  if (state.imageUrls.frente) content.push({ type: "image_url", image_url: { url: state.imageUrls.frente } });
  if (state.imageUrls.costas) content.push({ type: "image_url", image_url: { url: state.imageUrls.costas } });
  if (state.imageUrls.ladoE) content.push({ type: "image_url", image_url: { url: state.imageUrls.ladoE } });
  if (state.imageUrls.ladoD) content.push({ type: "image_url", image_url: { url: state.imageUrls.ladoD } });
  
  const diagnosticsParser = llm.withStructuredOutput(z.object({
    cifose_grau: z.number().describe("Estimativa de 0 a 100 de Cifose Torácica"),
    escoliose_desvio: z.number().describe("Estimativa de 0 a 100 de Desvio de Escoliose"),
    biotipo: z.enum(["Ectomorfo", "Mesomorfo", "Endomorfo"]).describe("Inferência visual do biotipo predominante"),
    tempo_ideal_treino_minutos: z.string().describe("Tempo ideal de treino em minutos justificando com o biotipo. Regra: Estipular tempo teto ou 'tempo mínimo para ganho de massa sem catabolizar' dependendo do biotipo."),
    detalhes: z.string().describe("Resumo detalhado biomecânico do usuário justificando medidas para evitar catabolismo."),
  }));

  const res = await diagnosticsParser.invoke([new HumanMessage({ content })]);
  return { diagnostico: res };
}

async function prescritorNode(state: typeof GraphState.State) {
  const content = `Você é um Personal Trainer Biomecânico de alta performance. 
Perfil do Aluno: Idade: ${state.profileData.age} anos, Peso Atual: ${state.profileData.weight}kg, Peso Alvo: ${state.profileData.target}kg.
Diagnóstico: Cifose: ${state.diagnostico?.cifose_grau} / Escoliose: ${state.diagnostico?.escoliose_desvio} / Biotipo: ${state.diagnostico?.biotipo}. 
Tempo Direcionado e Contexto: ${state.diagnostico?.tempo_ideal_treino_minutos} // Secundário: ${state.diagnostico?.detalhes}

Sua missão: 
1. Crie a rotina/ficha estruturada da SEMANA deste aluno (hipertrofia). Como ele tem um biotipo específico e particularidades, divida isso em letras clássicas (Treino A, Treino B, Treino C, etc). Preencha cada treino com VOLUME REAL DE ACADEMIA: de 6 a 9 exercícios por protocolo.
2. Crie UM ÚNICO (novo) Protocolo de Cárdio (Endurance / Corrida). Este protocolo DEVE basear-se no Biotipo: 
   - Ectomorfo deve receber treinos cardio curtos e intensos (ex: HIIT de 10-15 min, ou Fartlek) para evitar catabolismo.
   - Endomorfo deve receber cardio de maior volume (ex: LISS Zona 2, longo e contínuo) para derreter gordura.
   As fases do cardio devem mapear exatamente as etapas (ex: Aquecimento, Tiro, Recuperação, Desaquecimento).

Retorne um json contendo \`protocolos\` (Array de WorkoutProtocol) e \`cardioProtocol\` (Objeto de CardioProtocol).`;

  const protocolParser = llm.withStructuredOutput(z.object({
    protocolos: z.array(z.object({
      id: z.string(),
      label: z.string().describe("ex: TREINO A"),
      name: z.string().describe("ex: Dorsal e Bíceps Foco Biomecânico"),
      focus: z.string(),
      priority: z.boolean(),
      duration: z.number().describe("Duração neste treino (minutos)"),
      exercises: z.array(z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
        sets: z.number(),
        reps: z.string(),
        rest: z.number().describe("Descanso em segundos"),
        cadence: z.object({ 
          down: z.number().describe("Fase Excêntrica (seg)"), 
          pause: z.number().describe("Fase Isométrica (seg)"), 
          up: z.number().describe("Fase Concêntrica (seg)") 
        }),
        muscle: z.string(),
        posture: z.string().describe("Dica de postura essencial ou adaptação biotipo").optional()
      })),
    })),
    cardioProtocol: z.object({
      method: z.string().describe("Metodologia. Ex: 'HIIT Curto', 'Endurance Zona 2'"),
      totalDuration: z.number().describe("Duração total em minutos"),
      frequencySemanal: z.number().describe("Frequência ótima por semana"),
      focus: z.string().describe("Foco atrelado ao biotipo. Ex: 'Queima Acelerada Sem Catabolismo'"),
      phases: z.array(z.object({
        name: z.string().describe("Nome da fase. Ex: Aquecimento, Tiro, Descanso Ativo, Desaquecimento"),
        durationMinutes: z.number(),
        intensityZone: z.string().describe("Zona de Intensidade, Ex: 'Z1', 'Z2', 'Z3', 'Z4' ou 'Z5'"),
        description: z.string().describe("Instrução verbal simples para o aluno")
      }))
    }).describe("Motor Cardiovascular do aluno baseado no biotipo")
  }));

  const res = await protocolParser.invoke([new HumanMessage({ content })]);
  return { protocolos: res.protocolos, cardioProtocol: res.cardioProtocol };
}

export const biomechanicGraph = new StateGraph(GraphState)
  .addNode("Diagnosticador", diagnosticNode)
  .addNode("Prescritor", prescritorNode)
  .addEdge(START, "Diagnosticador")
  .addEdge("Diagnosticador", "Prescritor")
  .addEdge("Prescritor", END)
  .compile();
