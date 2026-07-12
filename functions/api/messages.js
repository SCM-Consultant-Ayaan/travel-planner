// Cloudflare Pages Function — Gemini API 프록시
// 브라우저는 이 함수(/api/messages)만 호출하고, 실제 Gemini 키는 서버(환경변수)에만 존재.
export async function onRequestPost({ request, env }) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return json({ error: "prompt 없음" }, 400);
    }
 
    const model = "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
 
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });
 
    if (!res.ok) {
      const detail = await res.text();
      return json({ error: "Gemini 오류", status: res.status, detail }, 502);
    }
 
    const data = await res.json();
    // Gemini 응답에서 텍스트만 추출
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
 
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
