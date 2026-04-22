import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

async function run() {
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro",
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const msg = new HumanMessage({
      content: [
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,fakedata" } }
      ]
    });

    const res = await llm.invoke([msg]);
    console.log("Success!:", res.content);

  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

run();
