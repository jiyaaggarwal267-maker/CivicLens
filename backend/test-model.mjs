const apiKey = process.env.GEMINI_API_KEY;
for (const model of ["gemini-3.6-flash", "gemini-flash-latest"]) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly the word: OK" }] }] }),
  });
  const data = await res.json();
  console.log(model, "->", res.status, JSON.stringify(data).slice(0, 200));
}
