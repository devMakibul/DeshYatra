import axios from 'axios';

export default async function handler(req, res) {
  console.log('📩 Travel suggestions API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { destination, month, date } = req.body;

  if (!destination || !month || !date) {
    console.warn('❌ Missing parameters:', { destination, month, date });
    return res.status(400).json({ error: 'Missing destination, month, or date' });
  }

  const AI_API_KEY = process.env.AI_API_KEY;

  if (!AI_API_KEY) {
    console.error('❌ Missing AI_API_KEY environment variable!');
    return res.status(500).json({ error: 'Server misconfiguration: AI_API_KEY missing' });
  }

  try {
    console.log(`🌍 Generating packing list for ${destination} (${month} ${date})`);

    const prompt = `
      Please provide a packing suggestion list and a list of upcoming events/holidays
      for a trip to ${destination} in ${month}, with the specific date of ${date}.

      The output MUST be a single JSON object with this structure:
      {
        "destination": "Paris",
        "month": "June",
        "packing_suggestion": [
          "👕 T-shirts",
          "👖 Jeans",
          "☂️ Umbrella"
        ],
        "events_calendar": [
          {
            "name": "🪖 Bastille Day Parade",
            "date": "YYYY-MM-DD",
            "description": "Annual national day celebration."
          }
        ]
      }
      Do NOT include markdown, explanations, or text outside the JSON.
    `;

    // 🔹 Call OpenRouter (or Gemini-compatible API)
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI travel assistant that replies with clean JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 🔹 Extract and safely parse response
    const rawText =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      response.data?.output_text ||
      '';

    console.log('🧠 AI raw response:', rawText.slice(0, 200));

    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch (err) {
      console.warn('⚠️ AI response was not valid JSON, returning raw text.');
      parsedData = { raw_text: rawText };
    }

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('💥 Travel suggestions API error:', error.response?.data || error.message);

    return res.status(500).json({
      error: 'Failed to generate travel suggestions.',
      details: error.response?.data || error.message
    });
  }
}
