# Hội đồng phản biện – bản miễn phí (Netlify + Gemini)
1. Lấy khóa miễn phí: https://aistudio.google.com/apikey (đăng nhập Google, bấm Create API key, không cần thẻ).
2. Đưa thư mục này lên GitHub, rồi https://app.netlify.com/start -> Import from Git.
3. Netlify -> Site configuration -> Environment variables: thêm GEMINI_API_KEY = khóa vừa lấy. Sau đó Trigger deploy.
Giọng AI dùng Gemini TTS (giới hạn lượt miễn phí); hết lượt tự chuyển sang giọng của trình duyệt (Edge cho giọng tiếng Việt tự nhiên nhất).
