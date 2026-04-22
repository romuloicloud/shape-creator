async function run() {
  console.log("Fetching production...");
  try {
    const res = await fetch("https://shape-creator.vercel.app/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: {} })
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    const body = await res.text();
    console.log("Body:", body);
  } catch (err: any) {
    console.error("Fetch threw Error:", err.message);
  }
}
run();
