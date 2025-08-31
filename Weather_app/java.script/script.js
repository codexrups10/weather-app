// === CONFIG ===
const apiKey = "a4faa5939680fffa4de149cbf15259ca"; // <--- replace with your OpenWeatherMap API key
let unit = "metric"; // "metric" or "imperial"

// Background image map - UPDATED WITH DIRECT IMAGE URLs
const backgrounds = {
    day: {
        clear: "url('blob:https://web.whatsapp.com/14928baa-70ae-4d2b-97bd-53c4e032abee')",
        clouds: "url('blob:https://web.whatsapp.com/14928baa-70ae-4d2b-97bd-53c4e032abee')",
        rain: "url('https://images.unsplash.com/photo-1534960322307-e83713f019a7?q=80&w=1974&auto=format&fit=crop')",
        snow: "url('https://images.unsplash.com/photo-1549477002-cdb2e53f1737?q=80&w=1974&auto=format&fit=crop')",
        thunder: "url('https://images.unsplash.com/photo-1605723709562-b75a13c32e54?q=80&w=2070&auto=format&fit=crop')",
        fog: "url('https://images.unsplash.com/photo-1522108783447-759dd18a202a?q=80&w=2070&auto=format&fit=crop')"
    },
    night: {
        clear: "url('https://images.unsplash.com/photo-1490730141103-6cac27aaab91?q=80&w=2070&auto=format&fit=crop')",
        clouds: "url('https://images.unsplash.com/photo-1498451296700-474017647209?q=80&w=2070&auto=format&fit=crop')",
        rain: "url('https://images.unsplash.com/photo-1485601955364-5a217277b084?q=80&w=1974&auto=format&fit=crop')",
        snow: "url('https://images.unsplash.com/photo-1542615456-12a8043685e1?q=80&w=2071&auto=format&fit=crop')",
        thunder: "url('https://images.unsplash.com/photo-1596772733479-24757e841f37?q=80&w=1974&auto=format&fit=crop')",
        fog: "url('https://images.unsplash.com/photo-1497931322230-cd7a5ef092d6?q=80&w=1974&auto=format&fit=crop')"
    },
    defaultDay: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop')",
    defaultNight: "url('https://images.unsplash.com/photo-1520697929420-a61ef558d11c?q=80&w=1974&auto=format&fit=crop')"
};

// === ELEMENT HELPERS ===
const $ = id => document.getElementById(id);

// Setup events
window.addEventListener("DOMContentLoaded", () => {
    $("btnSearch").addEventListener("click", onSearch);
    $("btnLocation").addEventListener("click", onLocation);
    $("cityInput").addEventListener("keydown", e => { if (e.key === "Enter") onSearch(); });
    $("unitToggle").addEventListener("click", toggleUnit);
    updateUnitButton();
});

// === ACTIONS ===
function onSearch(){
    const city = $("cityInput").value.trim();
    if (!city) return alert("Please enter a city name.");
    fetchCurrentByCity(city);
}
function onLocation(){
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
        pos => fetchCurrentByCoords(pos.coords.latitude, pos.coords.longitude),
        () => alert("Location access denied.")
    );
}
function toggleUnit(){
    unit = (unit === "metric") ? "imperial" : "metric";
    updateUnitButton();
    const displayed = document.querySelector("#weatherResult h2");
    if (displayed) {
        const cityText = displayed.textContent.split(",")[0];
        if (cityText) fetchCurrentByCity(cityText);
    }
}
function updateUnitButton(){
    $("unitToggle").textContent = (unit === "metric") ? "°C" : "°F";
}

// === FETCHERS ===
function fetchCurrentByCity(city){
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`;
    fetchWeather(url);
}
function fetchCurrentByCoords(lat, lon){
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    fetchWeather(url);
}
function fetchWeather(url){
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.cod && +data.cod !== 200) { alert(data.message || "Unable to fetch weather"); return; }
            displayCurrent(data);
            fetchForecast(data.name);
        })
        .catch(() => alert("Network error fetching weather."));
}
function fetchForecast(city){
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`;
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.cod && data.cod !== "200") return;
            displayForecast(data.list);
            displayHourly(data.list);
        })
        .catch(() => console.error("Network error fetching forecast."));
}

// === BACKGROUND CONTROL ===
function getConditionKey(weatherMain) {
    const w = (weatherMain || "").toLowerCase();
    if (w.includes("cloud")) return "clouds";
    if (w.includes("rain") || w.includes("drizzle")) return "rain";
    if (w.includes("snow")) return "snow";
    if (w.includes("thunder")) return "thunder";
    if (w.includes("mist") || w.includes("fog") || w.includes("haze") || w.includes("smoke")) return "fog";
    return "clear";
}
function setBackground(weatherMain, isDay) {
    const key = getConditionKey(weatherMain);
    const pack = isDay ? backgrounds.day : backgrounds.night;
    const fallback = isDay ? backgrounds.defaultDay : backgrounds.defaultNight;
    const url = pack[key] || fallback;
    document.body.style.setProperty("--bg-image", `${url}`);
}

// === DISPLAY CURRENT WEATHER ===
function displayCurrent(data){
    const box = $("weatherResult");
    box.classList.remove("hidden");

    const weatherMain = (data.weather?.[0]?.main || "").toLowerCase();
    const desc = (data.weather?.[0]?.description || "").toUpperCase();

    const now = data.dt;
    const sunrise = data.sys.sunrise;
    const sunset = data.sys.sunset;
    const isDay = now >= sunrise && now < sunset;

    let icon = isDay ? "wi-day-sunny" : "wi-night-clear";
    if (weatherMain.includes("cloud")) icon = isDay ? "wi-day-cloudy" : "wi-night-alt-cloudy";
    else if (weatherMain.includes("rain") || weatherMain.includes("drizzle")) icon = isDay ? "wi-day-rain" : "wi-night-alt-rain";
    else if (weatherMain.includes("snow")) icon = isDay ? "wi-day-snow" : "wi-night-alt-snow";
    else if (weatherMain.includes("thunder")) icon = isDay ? "wi-day-thunderstorm" : "wi-night-alt-thunderstorm";
    else if (weatherMain.includes("mist") || weatherMain.includes("fog")) icon = isDay ? "wi-day-fog" : "wi-night-fog";

    setBackground(weatherMain, isDay);

    const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const sunsetTime = new Date(sunset * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const temp = data.main.temp;
    const feels = data.main.feels_like;
    const unitsLabel = (unit === "metric") ? "°C" : "°F";

    box.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <i class="wi ${icon} weather-icon"></i>
        <h3>${desc}</h3>
        <p>🌡 Temp: ${temp.toFixed(1)}${unitsLabel} (Feels like: ${feels.toFixed(1)}${unitsLabel})</p>
        <div class="weather-details">
            <p>💧 Humidity: ${data.main.humidity}%</p>
            <p>🌬 Wind: ${data.wind.speed} ${unit === "metric" ? "m/s" : "mph"}</p>
            <p>🌄 Sunrise: ${sunriseTime}</p>
            <p>🌅 Sunset: ${sunsetTime}</p>
            <p>⚖ Pressure: ${data.main.pressure} hPa</p>
            <p>👁 Visibility: ${(data.visibility/1000).toFixed(1)} km</p>
        </div>
    `;
}

// === DISPLAY FORECAST & HOURLY ===
function displayForecast(list){
    const wrap = $("forecast");
    const grid = $("forecastGrid");
    wrap.classList.remove("hidden");
    grid.innerHTML = "";

    const perDay = {};
    list.forEach(item => {
        const dt = new Date(item.dt * 1000);
        const label = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const hour = dt.getHours();
        const diff = Math.abs(hour - 12);
        if (!perDay[label] || diff < perDay[label]._diff) perDay[label] = { ...item, _diff: diff };
    });

    Object.keys(perDay).slice(0,5).forEach(label => {
        const item = perDay[label];
        const weatherMain = (item.weather?.[0]?.main || "").toLowerCase();

        let icon = "wi-day-sunny";
        if (weatherMain.includes("cloud")) icon = "wi-cloudy";
        else if (weatherMain.includes("rain")) icon = "wi-rain";
        else if (weatherMain.includes("snow")) icon = "wi-snow";
        else if (weatherMain.includes("thunder")) icon = "wi-thunderstorm";
        else if (weatherMain.includes("fog")) icon = "wi-fog";

        const temp = item.main.temp.toFixed(1);
        const desc = item.weather?.[0]?.description || "";

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <h3>${label}</h3>
            <i class="wi ${icon}"></i>
            <p><strong>${temp}${unit === "metric" ? "°C":"°F"}</strong></p>
            <p style="margin:6px 0 0">${desc}</p>
        `;
        grid.appendChild(card);
    });
}

function displayHourly(list){
    const wrap = $("hourlyWrap");
    const container = $("hourly");
    container.innerHTML = "";
    wrap.classList.remove("hidden");

    const now = Date.now() / 1000;
    const hourlyEntries = [];
    for (let i = 0; i < list.length && hourlyEntries.length < 4; i++){
        if (list[i].dt > now) hourlyEntries.push(list[i]);
    }

    hourlyEntries.forEach(item => {
        const dt = new Date(item.dt * 1000);
        const timeStr = dt.toLocaleTimeString([], { hour: "numeric" });
        const temp = item.main.temp.toFixed(1);
        const desc = item.weather?.[0]?.description || "";
        const weatherMain = (item.weather?.[0]?.main || "").toLowerCase();

        let icon = "wi-day-sunny";
        if (weatherMain.includes("cloud")) icon = "wi-cloudy";
        else if (weatherMain.includes("rain")) icon = "wi-rain";
        else if (weatherMain.includes("snow")) icon = "wi-snow";
        else if (weatherMain.includes("thunder")) icon = "wi-thunderstorm";
        else if (weatherMain.includes("fog")) icon = "wi-fog";

        const card = document.createElement("div");
        card.className = "hour-card";
        card.innerHTML = `
            <div class="hour-time">${timeStr}</div>
            <i class="wi ${icon}"></i>
            <div class="hour-temp"><strong>${temp}${unit === "metric" ? "°C":"°F"}</strong></div>
            <div class="hour-desc">${desc}</div>
        `;
        container.appendChild(card);
    });
}