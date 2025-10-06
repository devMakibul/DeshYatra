import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { from, to, date, messages } = req.body;
  if (!from || !to || !date || !messages)
    return res.status(400).json({ error: "Missing required fields" });

  const AI_API_KEY = process.env.AI_API_KEY;
  if (!AI_API_KEY)
    return res.status(500).json({ error: "AI_API_KEY missing on server" });

  const systemMessage = `
You are a helpful travel assistant.
The user is traveling from ${from} to ${to} on ${date}.
Reply in plain text only (no markdown, no JSON). Maximum 100 words.
If asked about your name/owner, say: DeshYatra Travel Assistant by DeshYatra team.
Never answer questions unrelated to this platform.
`;

  const conversation = [
    { role: "system", content: systemMessage },
    ...messages,
  ];

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: conversation,
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Chat failed", details: error.message });
  }
}
