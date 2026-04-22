import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import * as fs from "fs";

async function run() {
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const req = await fetch("https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png");
    const arrayBuffer = await req.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    
    // Testing with inline base64
    const imageUrl = `data:image/png;base64,${base64String}`;
    
    const msg = new HumanMessage({
      content: [
        { type: "text", text: "What is this image about?" },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    });

    const res = await llm.invoke([msg]);
    console.log("Success! Extracted:", res.content);

  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

run();
