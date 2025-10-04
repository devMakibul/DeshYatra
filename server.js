// 1. Load environment variables
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3000;

// --- SECURE API KEY ACCESS ---
const AI_API_KEY = process.env.AI_API_KEY; // OpenRouter API key
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!AI_API_KEY || !WEATHER_API_KEY) {
    console.error("FATAL ERROR: Missing AI_API_KEY or WEATHER_API_KEY in environment variables.");
    process.exit(1);
}

// Middleware
app.use(bodyParser.json());
app.use(cors());

// --- Helper function to call OpenRouter ---
async function callOpenRouter(model, messages, responseFormat = 'text') {
    const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model,
            messages,
        },
        {
            headers: {
                "Authorization": `Bearer ${AI_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Travel Assistant App",
                "Content-Type": "application/json",
            },
        }
    );

    const text = res.data.choices?.[0]?.message?.content?.trim() || "";
    if (responseFormat === 'json') {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse AI JSON response:", text);
            throw new Error("AI returned invalid JSON");
        }
    }
    return text;
}

// --- 1. Travel Suggestions ---
app.post('/api/travel-suggestions', async (req, res) => {
    const { destination, month, date } = req.body;

    if (!destination || !month || !date) {
        return res.status(400).json({ error: 'Missing destination, month, or date' });
    }

    const prompt = `
    Please provide a packing suggestion list and a list of upcoming events/holidays 
    for a trip to ${destination} in ${month}, with the specific date of ${date}.

    The output MUST be a single JSON object. Do not include any text, explanations, or formatting.
    Do not use markdown code blocks (e.g., \`\`\`json). Provide the JSON response directly.

    The JSON object must have the following exact structure:
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
  `;

    try {
        const data = await callOpenRouter("deepseek/deepseek-chat-v3.1:free", [{ role: "user", content: prompt }], 'json');
        res.json(data);
    } catch (error) {
        console.error('Error calling OpenRouter API:', error.message);
        res.status(500).json({ error: 'Failed to get travel suggestions.', details: error.message });
    }
});

// --- 2. Chat (with history support) ---
app.post('/api/chat', async (req, res) => {
    const { from, to, date, messages } = req.body;

    if (!from || !to || !date || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing required chat parameters or invalid message format.' });
    }

    try {
        // Prepend a system message with context
        const conversation = [
            {
                role: 'system',
                content: `
                You are a helpful Indian travel assistant. The user is planning a trip from ${from} to ${to} on ${date}.
                Please provide a response based on this context. Only reply in plain text, not markdown.
                Answer in a maximum of 100 words, no more than that.
                If you are asked about your name or owner, you must say that you are DeshYatra Travel Assistant and the team behind DeshYatra platform made you.
                Never ever answer any question that is not related to travel and tourism and this platform. 
                `
            },
            ...messages // full chat history from frontend
        ];


        const reply = await callOpenRouter("deepseek/deepseek-chat-v3.1:free", conversation);

        res.json({ reply });
    } catch (error) {
        console.error('Error calling OpenRouter Chat API:', error.message);
        res.status(500).json({ error: 'Failed to get a chat response.', details: error.message });
    }
});

// --- 3. Trip Planner ---
app.post('/api/trip-planner', async (req, res) => {
    const { from, to, date, budget, adults, children } = req.body;

    if (!from || !to || !date || !budget || !adults || !children) {
        return res.status(400).json({ error: 'Missing trip planning data' });
    }

    const prompt = `
    You are an expert Indian travel planner. The user wants a trip itinerary.

    Trip Details:
    - Boarding: ${from}
    - Destination: ${to}
    - Date: ${date}
    - Budget: ₹${budget}
    - Travelers: ${adults} adults, ${children} children

    Please create a detailed, budget-friendly trip plan.
    - Use Markdown formatting only.
    - Use lists, headings, and bold text as needed.
    - Include activities, transportation, and dining options.
    - Do not include HTML tags or any extra text outside the Markdown.
    - Keep it structured and readable.
  `;

    try {
        const plan = await callOpenRouter("deepseek/deepseek-chat-v3.1:free", [{ role: "user", content: prompt }]);
        res.send(plan);
    } catch (error) {
        console.error('Error calling OpenRouter Trip Planner API:', error.message);
        res.status(500).json({ error: 'Failed to generate a trip plan.', details: error.message });
    }
});

// --- 4. Weather Proxy ---
app.get('/api/weather', async (req, res) => {
    const { destination, historyStartFormatted, historyEndFormatted, forecastDays } = req.query;

    if (!destination || !historyStartFormatted || !historyEndFormatted || !forecastDays) {
        return res.status(400).json({ error: 'Missing required weather parameters.' });
    }

    try {
        const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(destination)}&dt=${historyStartFormatted}&end_dt=${historyEndFormatted}`;
        const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(destination)}&days=${forecastDays}`;

        const [historyResponse, forecastResponse] = await Promise.all([
            axios.get(historyUrl),
            axios.get(forecastUrl)
        ]);

        res.json({
            historyData: historyResponse.data,
            forecastData: forecastResponse.data
        });
    } catch (error) {
        console.error('Weather API Proxy Error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to retrieve weather data via proxy.',
            details: error.response?.data || error.message
        });
    }
});

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
