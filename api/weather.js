import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { destination, historyStartFormatted, historyEndFormatted, forecastDays } = req.query;

  if (!destination || !historyStartFormatted || !historyEndFormatted || !forecastDays)
    return res.status(400).json({ error: 'Missing required weather parameters.' });

  try {
    const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(destination)}&dt=${historyStartFormatted}&end_dt=${historyEndFormatted}`;
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(destination)}&days=${forecastDays}`;

    const [historyResponse, forecastResponse] = await Promise.all([
      axios.get(historyUrl),
      axios.get(forecastUrl)
    ]);

    res.status(200).json({
      historyData: historyResponse.data,
      forecastData: forecastResponse.data
    });

  } catch (error) {
    console.error('Weather API Proxy Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to retrieve weather data via proxy.',
      details: error.response?.data || error.message
    });
  }
}
