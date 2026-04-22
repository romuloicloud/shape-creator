export async function runClientAi(apiKey: string, profileData: any, blobs: Record<string, Blob>) {
  const parts = [];
  const systemInstruction = `Você é um Personal Trainer Biomecânico de alta performance trabalhando em um software. 
Sua missão final é analisar o físico do aluno pelas fotos e entregar O PACOTE COMPLETO:
1. Diagnóstico severo de Postura, Assimetrias e Biotipo pelas fotos.
2. Fichas de Treino Completas (protocolos A, B, C). A seleção de cada exercício DEVE ser 100% PERSONALIZADA para corrigir as assimetrias mapeadas nas fotos e atingir o objetivo de peso do aluno.
   ATENÇÃO/CRÍTICO: É ESTRITAMENTE PROIBIDO retornar o array "exercises" vazio. Você DEVE e é OBRIGADO a gerar a lista real (6 a 9 exercícios biomecânicos) dentro do array "exercises" para CADA protocolo (A, B e C). Use técnicas avançadas. Nunca retorne um protocolo de treino sem exercícios.
3. Um protocolo de Cardio estratégico.

Retorne TODOS os dados solicitados pela estrutura JSON obrigatória. O não cumprimento da estrutura de exercícios resultará em falha do sistema.`;


  parts.push({
    text: `Perfil do Aluno: Idade: ${profileData.age} anos, Peso Atual: ${profileData.weight_kg}kg, Peso Alvo: ${profileData.goal_weight}kg. Imagens Frontal, Traseira e Laterais fornecidas abaixo. Cruze as angulações para montar o treino perfeito e completo e retorne o JSON com as fichas rigorosamente preenchidas.`
  });

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
    }
    return window.btoa(binary);
  };

  for (const k of Object.keys(blobs)) {
    const buffer = await blobs[k].arrayBuffer();
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: arrayBufferToBase64(buffer)
      }
    });
  }

  const schema = {
    type: "OBJECT",
    properties: {
      diagnostico: {
        type: "OBJECT",
        properties: {
          cifose_grau: { type: "NUMBER" },
          escoliose_desvio: { type: "NUMBER" },
          biotipo: { type: "STRING" },
          tempo_ideal_treino_minutos: { type: "STRING" },
          detalhes: { type: "STRING" }
        }
      },
      protocolos: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            label: { type: "STRING" },
            name: { type: "STRING" },
            focus: { type: "STRING" },
            priority: { type: "BOOLEAN" },
            duration: { type: "NUMBER" },
            exercises: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  name: { type: "STRING" },
                  image: { type: "STRING" },
                  sets: { type: "NUMBER" },
                  reps: { type: "STRING" },
                  rest: { type: "NUMBER" },
                  cadence: {
                    type: "OBJECT",
                    properties: { down: { type: "NUMBER" }, pause: { type: "NUMBER" }, up: { type: "NUMBER" } }
                  },
                  muscle: { type: "STRING" },
                  posture: { type: "STRING" }
                }
              }
            }
          }
        }
      },
      cardioProtocol: {
        type: "OBJECT",
        properties: {
          method: { type: "STRING" },
          totalDuration: { type: "NUMBER" },
          frequencySemanal: { type: "NUMBER" },
          focus: { type: "STRING" },
          phases: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                durationMinutes: { type: "NUMBER" },
                intensityZone: { type: "STRING" },
                description: { type: "STRING" }
              }
            }
          }
        }
      }
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    })
  });

  const raw = await response.json();
  if (raw.error) throw new Error(raw.error.message);
  
  const jStr = raw.candidates[0].content.parts[0].text;
  return JSON.parse(jStr);
}
