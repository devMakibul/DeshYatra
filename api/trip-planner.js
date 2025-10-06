import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { from, to, date, budget, adults, children } = req.body;
  if (!from || !to || !date || !budget || !adults || !children)
    return res.status(400).json({ error: "Missing trip planning data" });

  const AI_API_KEY = process.env.AI_API_KEY;
  if (!AI_API_KEY)
    return res.status(500).json({ error: "AI_API_KEY missing on server" });

  const prompt = `
You are an expert travel planner. The user wants a trip itinerary.

Trip Details:
- Boarding: ${from}
- Destination: ${to}
- Date: ${date}
- Budget: ₹${budget}
- Travelers: ${adults} adults, ${children} children

Create a detailed, budget-friendly trip plan using **Markdown**.
Use bullet points, headings, and short sections for clarity.
Maximum heading size is ###.
Use --- (as md) for separating days or other long topics.
Include activities, transport, and dining options.
Keep it concise and easy to read.
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          { role: "system", content: "You are an expert travel planner who writes Markdown itineraries." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const markdown = response.data?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).send(markdown);
  } catch (error) {
    console.error("Trip Planner Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate trip plan", details: error.message });
  }
}
