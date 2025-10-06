import axios from "axios";

export default async function handler(req, res) {
  console.log("📩 /api/travel-suggestions endpoint triggered");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1️⃣ Log request body
  console.log("📦 req.body:", req.body);

  const { destination, month, date } = req.body;

  if (!destination || !month || !date) {
    console.log("❌ Missing parameters:", { destination, month, date });
    return res.status(400).json({ error: "Missing parameters" });
  }

  // 2️⃣ Check environment variable
  const AI_API_KEY = process.env.AI_API_KEY;
  console.log("🔑 AI_API_KEY found:", !!AI_API_KEY);

  if (!AI_API_KEY) {
    return res.status(500).json({ error: "AI_API_KEY missing on server" });
  }

  // 3️⃣ Construct prompt
  const prompt = `
You are a travel assistant that ONLY outputs valid JSON (no explanations, no markdown, no code blocks).

Task:
Provide a packing suggestion list and a list of upcoming events/holidays for a trip.

Input:
- Destination: ${destination}
- Month: ${month}
- Date: ${date}

Output format (MUST match exactly):
{
  "destination": "${destination}",
  "month": "${month}",
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

Rules:
- Do NOT include any text outside of JSON.
- Do NOT wrap JSON in code blocks.
- Respond with valid JSON only.
`;

  try {
    // 4️⃣ Log before sending request
    console.log("➡️ Calling OpenRouter API now...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful travel assistant that outputs valid JSON only. No markdown or text outside JSON.",
          },
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

    // 5️⃣ Log after response
    console.log("✅ Got response from OpenRouter API");

    const raw =
      response.data?.choices?.[0]?.message?.content ||
      response.data?.output_text ||
      response.data?.text ||
      "";

    console.log("🔹 Raw AI output (first 150 chars):", raw.slice(0, 150));

    // 6️⃣ Try parsing JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.log("⚠️ Failed to parse JSON, trying to extract substring...");
      const match = raw.match(/{[\s\S]*}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = { raw_text: raw };
        }
      } else {
        parsed = { raw_text: raw };
      }
    }

    console.log("✅ Successfully parsed JSON output");
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("💥 Error calling OpenRouter API:", err.response?.data || err.message);
    return res.status(500).json({
      error: "AI API failed",
      details: err.response?.data || err.message,
    });
  }
}
