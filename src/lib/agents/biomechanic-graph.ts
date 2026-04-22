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

// Using gemini-2.5-flash as it responds in 3-5s, avoiding strict Vercel Hobby serverless timeouts (10-15s)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.1,
  apiKey: process.env.GEMINI_API_KEY || "dummy_for_build",
});

async function scannerMasterNode(state: typeof GraphState.State) {
  const content: any[] = [
    { type: "text", text: `Você é um Personal Trainer Biomecânico de alta performance. 
Sua missão final é analisar o físico do aluno pelas fotos e entregar O PACOTE COMPLETO:
1. Diagnóstico de Postura e Biotipo.
2. Fichas de Treino Completas (protocolos) focadas no perfil (priorizando hipertrofia sem catabolizar). Letras A, B, C etc. (De 6 a 9 exercícios por treino).
3. Um protocolo de Cardio Específico para o Biotipo para queimar ou preservar massa.

Perfil do Aluno: Idade: ${state.profileData.age} anos, Peso Atual: ${state.profileData.weight}kg, Peso Alvo: ${state.profileData.target}kg.
Imagens Frontal, Traseira e Laterais fornecidas abaixo.
Retorne TODOS os dados solicitados pela estrutura JSON obrigatória.` }
  ];
  
  if (state.imageUrls.frente) content.push({ type: "image_url", image_url: { url: state.imageUrls.frente } });
  if (state.imageUrls.costas) content.push({ type: "image_url", image_url: { url: state.imageUrls.costas } });
  if (state.imageUrls.ladoE) content.push({ type: "image_url", image_url: { url: state.imageUrls.ladoE } });
  if (state.imageUrls.ladoD) content.push({ type: "image_url", image_url: { url: state.imageUrls.ladoD } });
  
  const masterParser = llm.withStructuredOutput(z.object({
    diagnostico: z.object({
      cifose_grau: z.number().describe("Estimativa de 0 a 100 de Cifose Torácica"),
      escoliose_desvio: z.number().describe("Estimativa de 0 a 100 de Desvio de Escoliose"),
      biotipo: z.enum(["Ectomorfo", "Mesomorfo", "Endomorfo"]),
      tempo_ideal_treino_minutos: z.string().describe("Tempo ideal de treino justificando com o biotipo."),
      detalhes: z.string().describe("Resumo detalhado biomecânico do usuário."),
    }),
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
        rest: z.number(),
        cadence: z.object({ down: z.number(), pause: z.number(), up: z.number() }),
        muscle: z.string(),
        posture: z.string().optional()
      })),
    })),
    cardioProtocol: z.object({
      method: z.string().describe("Ex: 'HIIT Curto', 'Endurance Zona 2'"),
      totalDuration: z.number(),
      frequencySemanal: z.number(),
      focus: z.string(),
      phases: z.array(z.object({
        name: z.string(),
        durationMinutes: z.number(),
        intensityZone: z.string(),
        description: z.string()
      }))
    })
  }));

  const res = await masterParser.invoke([new HumanMessage({ content })]);
  return { diagnostico: res.diagnostico, protocolos: res.protocolos, cardioProtocol: res.cardioProtocol };
}

export const biomechanicGraph = new StateGraph(GraphState)
  .addNode("ScannerMaster", scannerMasterNode)
  .addEdge(START, "ScannerMaster")
  .addEdge("ScannerMaster", END)
  .compile();
