import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function run() {
  try {
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest", "gemini-1.0-pro"];
    
    for (const model of modelsToTest) {
      console.log(`\nTesting: ${model}`);
      try {
        const llm = new ChatGoogleGenerativeAI({
          model, 
          apiKey: process.env.GEMINI_API_KEY,
        });
        const res = await llm.invoke("Responda apenas OK.");
        console.log(`Success with ${model}:`, res.content);
      } catch (err: any) {
        console.error(`Error with ${model}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("Global Error:", err.message);
  }
}

run();
