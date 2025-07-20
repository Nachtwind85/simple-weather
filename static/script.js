let currentChart = null;
let currentTodayChart = null;
let map = null;
let cityMarker = null;

function initTabs() {
    const tabButtons = document.querySelectorAll("#cityTabs button");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const lat = +btn.dataset.lat;
            const lon = +btn.dataset.lon;
            fetchAndRender(lat, lon);

            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
}

async function fetchAndRender(lat, lon) {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const currentHour = now.getHours();

        const todayIndices = data.hourly.time
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.startsWith(today))
        .map(({ i }) => i);

        const todayTimes = todayIndices.map(i =>
        new Date(data.hourly.time[i]).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        );
        const todayTemps = todayIndices.map(i => data.hourly.temperature_2m[i]);
        const todayHumidity = todayIndices.map(i => data.hourly.relative_humidity_2m[i]);
        const todayPrecip = todayIndices.map(i => data.hourly.precipitation[i]);

        const currentHourIndex = todayIndices.find(i =>
        new Date(data.hourly.time[i]).getHours() === currentHour
        );

        const filteredIndices = data.hourly.time
        .map((_, i) => i)
        .filter(i => i % 3 === 0);

        const times = filteredIndices.map(i =>
        new Date(data.hourly.time[i]).toLocaleString("de-DE", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit"
        })
        );
        const temps = filteredIndices.map(i => data.hourly.temperature_2m[i]);
        const humidities = filteredIndices.map(i => data.hourly.relative_humidity_2m[i]);
        const precips = filteredIndices.map(i => data.hourly.precipitation[i]);

        const minTemp = Math.min(...temps);
        const tempAxisMin = Math.floor(minTemp - 5);

        // Heute-Chart
        if (currentTodayChart) currentTodayChart.destroy();
        const todayCtx = document.getElementById("todayChart").getContext("2d");
        currentTodayChart = new Chart(todayCtx, {
            type: "bar",
            data: {
                labels: todayTimes,
                datasets: [
                    {
                        label: "Temperatur (°C)",
                                      data: todayTemps,
                                      type: "line",
                                      borderColor: "red",
                                      yAxisID: "y"
                    },
                    {
                        label: "Luftfeuchtigkeit (%)",
                                      data: todayHumidity,
                                      type: "line",
                                      borderColor: "blue",
                                      yAxisID: "y1"
                    },
                    {
                        label: "Regen (mm)",
                                      data: todayPrecip,
                                      backgroundColor: "turquoise",
                                      yAxisID: "y2"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        position: "left",
                        title: { display: true, text: "Temperatur (°C)", color: "red" },
                                      min: Math.floor(Math.min(...todayTemps) - 5),
                                      ticks: { color: "red" }
                    },
                    y1: {
                        position: "right",
                        title: { display: true, text: "Luftfeuchtigkeit (%)", color: "blue" },
                                      grid: { drawOnChartArea: false },
                                      ticks: { color: "blue" }
                    },
                    y2: {
                        position: "right",
                        title: { display: true, text: "Regen (mm)", color: "turquoise" },
                                      grid: { drawOnChartArea: false },
                                      ticks: { color: "turquoise" },
                                      offset: true
                    }
                },
                plugins: {
                    annotation: {
                        annotations: currentHourIndex ? {
                            currentLine: {
                                type: "line",
                                xMin: todayIndices.indexOf(currentHourIndex),
                                      xMax: todayIndices.indexOf(currentHourIndex),
                                      borderColor: "red",
                                      borderWidth: 2,
                                      label: {
                                          content: "Jetzt",
                                      enabled: true,
                                      position: "start",
                                      backgroundColor: "red",
                                      color: "white"
                                      }
                            }
                        } : {}
                    }
                }
            }
        });

        // 7-Tage-Vorhersage-Chart
        if (currentChart) currentChart.destroy();
        const ctx = document.getElementById("forecastChart").getContext("2d");
        currentChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: times,
                datasets: [
                    {
                        label: "Temperatur (°C)",
                                 data: temps,
                                 type: "line",
                                 borderColor: "red",
                                 yAxisID: "y"
                    },
                    {
                        label: "Luftfeuchtigkeit (%)",
                                 data: humidities,
                                 type: "line",
                                 borderColor: "blue",
                                 yAxisID: "y1"
                    },
                    {
                        label: "Regen (mm)",
                                 data: precips,
                                 backgroundColor: "turquoise",
                                 yAxisID: "y2"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        position: "left",
                        title: { display: true, text: "Temperatur (°C)", color: "red" },
                                 min: tempAxisMin,
                                 ticks: { color: "red" }
                    },
                    y1: {
                        position: "right",
                        title: { display: true, text: "Luftfeuchtigkeit (%)", color: "blue" },
                                 grid: { drawOnChartArea: false },
                                 ticks: { color: "blue" }
                    },
                    y2: {
                        position: "right",
                        title: { display: true, text: "Regen (mm)", color: "turquoise" },
                                 grid: { drawOnChartArea: false },
                                 ticks: { color: "turquoise" },
                                 offset: true
                    }
                }
            }
        });

        updateMap(lat, lon);
    } catch (err) {
        console.error("Fehler beim Laden der Wetterdaten", err);
    }
}

// Leaflet Map
function updateMap(lat, lon) {
    if (!map) {
        map = L.map("map").setView([lat, lon], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        cityMarker = L.marker([lat, lon]).addTo(map);
    } else {
        map.setView([lat, lon], 10);
        cityMarker.setLatLng([lat, lon]);
    }
}

// Dark Mode
function initDarkMode() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    if (prefersDark.matches) {
        document.body.classList.add("dark-mode");
    }
    document.getElementById("darkModeToggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
}

window.onload = () => {
    initTabs();
    initDarkMode();
    const first = document.querySelector("#cityTabs button");
    if (first) {
        fetchAndRender(+first.dataset.lat, +first.dataset.lon);
        first.classList.add("active");
    }
};
