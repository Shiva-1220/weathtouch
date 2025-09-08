async function getWeather() {
  const city = document.getElementById("cityInput").value;

  // 1. Get latitude & longitude of city
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    document.getElementById("weatherResult").innerHTML = `<p>❌ City not found!</p>`;
    return;
  }

  const { latitude, longitude, name, country } = geoData.results[0];

  // 2. Fetch 5-day forecast
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode,windspeed_10m_max&timezone=auto`;

  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();

  const days = weatherData.daily;

  // 3. Display results
  let forecastHTML = `<h3>${name}, ${country}</h3>`;
  forecastHTML += `<div class="forecast">`;

  for (let i = 0; i < days.time.length; i++) {
    forecastHTML += `
      <div class="day">
        <h4>${days.time[i]}</h4>
        <p>🌡 Max: ${days.temperature_2m_max[i]}°C</p>
        <p>🌡 Min: ${days.temperature_2m_min[i]}°C</p>
        <p>🌅 Sunrise: ${days.sunrise[i].split("T")[1]}</p>
        <p>🌇 Sunset: ${days.sunset[i].split("T")[1]}</p>
        <p>🌬️ Wind: ${days.windspeed_10m_max[i]} km/h</p>

      </div>
    `;
  }

  forecastHTML += `</div>`;
  document.getElementById("weatherResult").innerHTML = forecastHTML;
}
