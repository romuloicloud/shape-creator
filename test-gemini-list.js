async function run() {
  try {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:", data.models.map(m => m.name).join(", "));
    } else {
      console.log("Response:", data);
    }
  } catch (err) {
    console.error("Global Error:", err.message);
  }
}

run();
