import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { destination, month, date } = req.body;
  if (!destination || !month || !date) {
    return res.status(400).json({ error: 'Missing destination, month, or date' });
  }

  const prompt = `
You are a helpful travel assistant. Provide a packing suggestion and list of upcoming events for a trip to ${destination} in ${month}, date ${date}.
Output MUST be a JSON object with:
{
  "destination": "Paris",
  "month": "June",
  "packing_suggestion": ["👕 T-shirts","👖 Jeans","☂️ Umbrella"],
  "events_calendar":[{"name":"🪖 Bastille Day Parade","date":"YYYY-MM-DD","description":"Annual national day celebration."}]
}
Do not include markdown or extra text.
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/deepseek/deepseek-chat-v3.1:free/api',
      { prompt },
      { headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` } }
    );

    const text = response.data?.output_text || response.data?.text || '{}';
    const data = JSON.parse(text);
    res.status(200).json(data);

  } catch (error) {
    console.error('Travel Suggestions Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get travel suggestions', details: error.message });
  }
}
