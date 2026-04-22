export async function runClientAi(apiKey: string, profileData: any, blobs: Record<string, Blob>) {
  const parts = [];
  parts.push({
    text: `Você é um Personal Trainer Biomecânico de alta performance. 
Sua missão final é analisar o físico do aluno pelas fotos e entregar O PACOTE COMPLETO:
1. Diagnóstico de Postura e Biotipo.
2. Fichas de Treino Completas (protocolos) focadas no perfil (priorizando hipertrofia sem catabolizar). Letras A, B, C etc. (De 6 a 9 exercícios OBJETIVOS por treino). ATENÇÃO: É ESTAritamente PROIBIDO retornar o array "exercises" vazio. Você DEVE gerar a lista completa de exercícios para cada protocolo.
3. Um protocolo de Cardio Específico para o Biotipo para queimar ou preservar massa.

Perfil do Aluno: Idade: ${profileData.age} anos, Peso Atual: ${profileData.weight}kg, Peso Alvo: ${profileData.target}kg.
Imagens Frontal, Traseira e Laterais fornecidas abaixo.
Retorne TODOS os dados solicitados pela estrutura JSON obrigatória.`
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
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
