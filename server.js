import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

// Chat API


app.post("/api/chat", async (req, res) => {
  try {
    const { message, weather } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided." });
    }

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
        model: "openai/gpt-3.5-turbo", // free-compatible
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      reply: response.data.choices[0].message.content
    });

  } catch (err) {
    console.error("OPENROUTER ERROR:", err.response?.data || err.message);
    res.json({ reply: "AI failed 😓" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});