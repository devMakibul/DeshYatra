import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { from, to, date, messages } = req.body;
  if (!from || !to || !date || !messages) return res.status(400).json({ error: 'Missing required fields' });

  const systemMessage = `
You are a helpful travel assistant. The user is traveling from ${from} to ${to} on ${date}.
Only reply in plain text, max 100 words. 
If asked about your name/owner, say: DeshYatra Travel Assistant by DeshYatra team.
Never answer questions unrelated to this platform.
`;

  const conversation = [
    { role: 'system', content: systemMessage },
    ...messages
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/deepseek/deepseek-chat-v3.1:free/api',
      { messages: conversation },
      { headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` } }
    );

    const reply = response.data?.output_text || response.data?.text || '';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Chat API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
}
