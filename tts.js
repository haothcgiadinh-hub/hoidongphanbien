// Giọng nói AI miễn phí qua Gemini TTS (gói miễn phí giới hạn lượt). Hết lượt thì trình duyệt tự dùng giọng có sẵn.
const FEMALE = ['Kore', 'Leda', 'Aoede', 'Zephyr'];
const MALE = ['Charon', 'Orus', 'Puck', 'Fenrir'];
function wav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { statusCode: 500, body: 'Thiếu GEMINI_API_KEY' };
  try {
    const { text, g, vi = 0, style = '', mood = 'hỏi' } = JSON.parse(event.body || '{}');
    const pool = g === 'f' ? FEMALE : MALE;
    const prompt = `Nói bằng tiếng Việt với giọng ${g === 'f' ? 'nữ' : 'nam'} trung niên của một giảng viên thật trong hội đồng bảo vệ khóa luận, tính cách ${style}, cảm xúc ${mood}, nhịp tự nhiên có ngắt nghỉ, không đọc như máy: ${String(text).slice(0, 700)}`;
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: pool[vi % pool.length] } } } },
      }),
    });
    if (!r.ok) return { statusCode: 502, body: (await r.text()).slice(0, 300) };
    const d = await r.json();
    const b64 = (d.candidates || [])[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return { statusCode: 502, body: 'Không có âm thanh' };
    return { statusCode: 200, isBase64Encoded: true, headers: { 'content-type': 'audio/wav' }, body: wav(Buffer.from(b64, 'base64')).toString('base64') };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
};
