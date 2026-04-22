async function run() {
  const req = await fetch("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paths: { frente: "test/1.jpg" } // just dummy to see response
    })
  });
  const text = await req.text();
  console.log("Status:", req.status);
  console.log("Body:", text);
}
run();
