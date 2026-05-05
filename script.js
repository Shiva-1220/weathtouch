// DOM Elements
const elements = {
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  suggestions: document.getElementById('suggestions'),
  mainTemp: document.getElementById('main-temp'),
  weatherDesc: document.getElementById('weather-desc'),
  weatherIcon: document.getElementById('weather-icon'),
  locationName: document.getElementById('location-name'),
  dateToday: document.getElementById('date-today'),
  valHumidity: document.getElementById('val-humidity'),
  valWind: document.getElementById('val-wind'),
  valPressure: document.getElementById('val-pressure'),
  valUv: document.getElementById('val-uv'),
  valAqi: document.getElementById('val-aqi'),
  aqiStatus: document.getElementById('aqi-status'),
  valRain: document.getElementById('val-rain'),
  aiInsightText: document.getElementById('ai-insight-text'),
  forecastGrid: document.getElementById('forecast-grid'),
  currentTime: document.getElementById('current-time'),
  themeToggle: document.getElementById('theme-toggle'),
  chatLauncher: document.getElementById('chat-launcher'),
  chatWindow: document.getElementById('chat-window'),
  closeChat: document.getElementById('close-chat'),
  chatScroll: document.getElementById('chat-scroll'),
  chatInput: document.getElementById('chat-input'),
  sendBtn: document.getElementById('send-btn'),
  typingIndicator: document.getElementById('typing-indicator')
};

let weatherChart = null;
let currentCity = "Greater Noida";

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);
  fetchWeather(currentCity);
  setupEventListeners();
});

function setupEventListeners() {
  elements.searchBtn.addEventListener('click', () => {
    const val = elements.cityInput.value.trim();
    if (val) fetchWeather(val);
  });

  elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.searchBtn.click();
  });

  elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  // Chatbot logic
  elements.chatLauncher.addEventListener('click', () => {
    elements.chatWindow.classList.toggle('hidden');
    if (!elements.chatWindow.classList.contains('hidden')) {
      elements.chatInput.focus();
    }
  });

  elements.closeChat.addEventListener('click', () => {
    elements.chatWindow.classList.add('hidden');
  });

  elements.sendBtn.addEventListener('click', sendMessage);
  elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Autocomplete
  elements.cityInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) {
      elements.suggestions.classList.add('hidden');
      return;
    }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
      const data = await res.json();
      if (data.results) {
        showSuggestions(data.results);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function showSuggestions(cities) {
  elements.suggestions.innerHTML = '';
  cities.forEach(city => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = `${city.name}, ${city.admin1 || ''} ${city.country}`;
    div.onclick = () => {
      elements.cityInput.value = city.name;
      elements.suggestions.classList.add('hidden');
      fetchWeather(city.name);
    };
    elements.suggestions.appendChild(div);
  });
  elements.suggestions.classList.remove('hidden');
}

async function fetchWeather(city) {
  try {
    // 1. Get Coords
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results) throw new Error("City not found");
    
    const loc = geoData.results[0];
    const { latitude, longitude, name, country } = loc;

    // 2. Get Weather & Air
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi`;

    const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
    const wData = await wRes.json();
    const aData = await aRes.json();

    updateDashboard(name, country, wData, aData);
  } catch (err) {
    alert(err.message);
  }
}

function updateDashboard(name, country, weather, air) {
  const cur = weather.current;
  const aqi = air.current.european_aqi;

  elements.locationName.textContent = `${name}, ${country}`;
  elements.mainTemp.textContent = `${Math.round(cur.temperature_2m)}°C`;
  elements.weatherDesc.textContent = getWeatherDesc(cur.weather_code);
  elements.weatherIcon.textContent = getWeatherIcon(cur.weather_code);
  elements.dateToday.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  elements.valHumidity.textContent = `${cur.relative_humidity_2m}%`;
  elements.valWind.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  elements.valPressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;
  elements.valUv.textContent = cur.uv_index.toFixed(1);
  elements.valAqi.textContent = aqi;
  elements.aqiStatus.textContent = getAQIStatus(aqi);
  elements.valRain.textContent = `${Math.round(cur.precipitation * 100)}%`;

  updateChart(weather.hourly);
  updateForecast(weather.daily);
  generateSimpleAIInsight(name, weather);
}

function updateChart(hourly) {
  const labels = hourly.time.slice(0, 8).map(t => new Date(t).getHours() + ":00");
  const temps = hourly.temperature_2m.slice(0, 8);

  const ctx = document.getElementById('tempChart').getContext('2d');
  if (weatherChart) weatherChart.destroy();

  weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperature',
        data: temps,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { display: true }, y: { beginAtZero: false } }
    }
  });
}

function updateForecast(daily) {
  elements.forecastGrid.innerHTML = '';
  // Skip today, show next 7 days
  for (let i = 1; i < 8; i++) {
    const date = new Date(daily.time[i]);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="day">${day}</div>
      <div class="icon" style="font-size: 2rem">${getWeatherIcon(daily.weather_code[i])}</div>
      <div class="temp-range">H: ${Math.round(daily.temperature_2m_max[i])}° L: ${Math.round(daily.temperature_2m_min[i])}°</div>
    `;
    elements.forecastGrid.appendChild(card);
  }
}

// Logic Mapping Helpers
function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤";
  if (code <= 48) return "☁️";
  if (code <= 67) return "🌧";
  if (code <= 77) return "🌨";
  return "⛈";
}

function getWeatherDesc(code) {
  if (code === 0) return "Clear Skies";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Overcast Fog";
  if (code <= 67) return "Rainy";
  return "Stormy Skies";
}

function getAQIStatus(val) {
  if (val <= 50) return "Good";
  if (val <= 100) return "Moderate";
  return "Unhealthy";
}

function updateTime() {
  const d = new Date();
  elements.currentTime.textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function generateSimpleAIInsight(city, weather) {
  const temp = weather.current.temperature_2m;
  const isRain = weather.current.precipitation > 0;
  
  let text = `In ${city}, it's currently ${temp}°C. `;
  if (temp > 28) text += "The sun is strong today, stay hydrated and wear light clothes.";
  else if (temp < 15) text += "A bit chilly! A light jacket or sweater would be ideal.";
  else text += "The weather is quite pleasant for outdoor activities.";
  
  if (isRain) text += " Don't forget your umbrella, rain is expected.";
  
  elements.aiInsightText.textContent = text;
}

// CHATBOT LOGIC
async function sendMessage() {
  const text = elements.chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  elements.chatInput.value = "";
  elements.typingIndicator.classList.remove("hidden");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        weather: {
          location: elements.locationName.textContent,
          temp: elements.mainTemp.textContent,
          humidity: elements.valHumidity.textContent,
          wind: elements.valWind.textContent,
          description: elements.weatherDesc.textContent
        }
      })
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    addMessage(data.reply || "No response", "bot");

  } catch (err) {
    console.error(err);
    addMessage("Server not responding 😓", "bot");
  } finally {
    elements.typingIndicator.classList.add("hidden");
  }
}

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  div.textContent = text;
  elements.chatScroll.appendChild(div);
  elements.chatScroll.scrollTop = elements.chatScroll.scrollHeight;
}
