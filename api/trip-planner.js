import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { from, to, date, budget, adults, children } = req.body;
  if (!from || !to || !date || !budget || !adults || !children)
    return res.status(400).json({ error: 'Missing trip planning data' });

  const prompt = `
You are an expert travel planner. The user wants a trip itinerary.
Trip Details:
- Boarding: ${from}
- Destination: ${to}
- Date: ${date}
- Budget: ₹${budget}
- Travelers: ${adults} adults, ${children} children

Create a detailed, budget-friendly trip plan.
Use Markdown formatting only (lists, headings, bold).
Include activities, transportation, and dining options.
Do not use HTML or extra text.
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/deepseek/deepseek-chat-v3.1:free/api',
      { prompt },
      { headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` } }
    );

    const markdown = response.data?.output_text || response.data?.text || '';
    res.status(200).send(markdown);

  } catch (error) {
    console.error('Trip Planner Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate trip plan', details: error.message });
  }
}
