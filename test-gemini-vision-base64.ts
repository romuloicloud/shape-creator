import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

async function run() {
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro",
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const msg = new HumanMessage({
      content: [
        { type: "text", text: "Are you alive?" }
      ]
    });

    const res = await llm.invoke([msg]);
    console.log("Success!:", res.content);

  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

run();
