package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"
)

type City struct {
	Name string `json:"name"`
	Lat  string `json:"lat"`
	Lon  string `json:"lon"`
}

type ForecastResponse struct {
	Hourly struct {
		Time          []string  `json:"time"`
		Temperature   []float64 `json:"temperature_2m"`
		Humidity      []float64 `json:"relative_humidity_2m"`
		Precipitation []float64 `json:"precipitation"`
	} `json:"hourly"`
}

var cities []City

func main() {
	// Konfiguration laden
	file, err := os.Open("config.json")
	if err != nil {
		log.Fatalf("Fehler beim Laden von config.json: %v", err)
	}
	defer file.Close()
	if err := json.NewDecoder(file).Decode(&cities); err != nil {
		log.Fatalf("Fehler beim Parsen der Konfiguration: %v", err)
	}

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/api/weather", weatherHandler)

	fmt.Println("Server läuft auf http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/index.html"))
	tmpl.Execute(w, cities)
}

func weatherHandler(w http.ResponseWriter, r *http.Request) {
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	if lat == "" || lon == "" {
		http.Error(w, "Koordinaten fehlen", http.StatusBadRequest)
		return
	}

	api := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&hourly=temperature_2m,relative_humidity_2m,precipitation&forecast_days=7&timezone=auto",
			   url.QueryEscape(lat), url.QueryEscape(lon))

	resp, err := http.Get(api)
	if err != nil {
		http.Error(w, "Fehler beim Abrufen der Wetterdaten", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("Open-Meteo API Fehler: %s", resp.Status), http.StatusInternalServerError)
		return
	}

	var forecast ForecastResponse
	if err := json.NewDecoder(resp.Body).Decode(&forecast); err != nil {
		http.Error(w, "Fehler beim Parsen der Wetterdaten", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forecast)
}
