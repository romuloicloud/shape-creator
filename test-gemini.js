const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

async function run() {
  try {
    const modelsToTest = ["gemini-flash-latest"];
    
    for (const model of modelsToTest) {
      console.log(`\nTesting: ${model}`);
      try {
        const llm = new ChatGoogleGenerativeAI({
          model, 
          apiKey: process.env.GEMINI_API_KEY,
        });
        const res = await llm.invoke("Responda apenas OK.");
        console.log(`Success with ${model}:`, res.content);
      } catch (err) {
        console.error(`Error with ${model}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Global Error:", err.message);
  }
}

run();
