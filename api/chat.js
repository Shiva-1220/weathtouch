import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, weather } = req.body;

    const prompt = `
You are WeatherTouch AI.

Weather Data:
${JSON.stringify(weather || {})}

User Question:
${message}

Give a short, friendly answer.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json({
      reply: response.data.choices[0].message.content
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ reply: "AI failed 😓" });
  }
}