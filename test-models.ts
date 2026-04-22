async function run() {
  const k = process.env.GEMINI_API_KEY;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
  const d = await r.json();
  if (d.models) {
    const names = d.models.map((m: any) => m.name).filter((n: string) => n.includes("gemini"));
    console.log("AVAILABLE GEMINI MODELS:");
    names.forEach((n: string) => console.log(n));
  } else {
    console.log("Failed to fetch models:", d);
  }
}
run();
