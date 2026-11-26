// AI giám khảo + đối chiếu đúng/sai, dùng Google Gemini (có gói miễn phí, lấy khóa tại aistudio.google.com).
const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean);
const SYS = 'Bạn là giám khảo hội đồng bảo vệ khóa luận Luật kinh tế tại Việt Nam, am hiểu Luật Doanh nghiệp 2020 và văn bản sửa đổi. Luôn trả về DUY NHẤT một đối tượng JSON hợp lệ, không kèm markdown. Nếu không chắc về điều khoản hay con số cụ thể, nói rõ là cần đối chiếu văn bản chính thức thay vì bịa.';
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { statusCode: 500, body: 'Thiếu GEMINI_API_KEY' };
  let prompt = '';
  try { prompt = String(JSON.parse(event.body || '{}').prompt || '').slice(0, 6000); } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }
  let last = '';
  for (const model of [...new Set(MODELS)]) {
    for (const think of [true, false]) {
      try {
        const gc = { responseMimeType: 'application/json', maxOutputTokens: 1200, temperature: 0.9 };
        if (think) gc.thinkingConfig = { thinkingBudget: 0 };
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gc }),
        });
        if (!r.ok) { last = model + ' ' + r.status + ' ' + (await r.text()).slice(0, 300); if (r.status === 400 && think) continue; break; }
        const d = await r.json();
        const txt = ((d.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('');
        const m = txt.match(/\{[\s\S]*\}/);
        if (m) return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: m[0] };
        last = model + ' không có JSON';
        break;
      } catch (e) { last = String(e); break; }
    }
  }
  return { statusCode: 502, body: last };
};
