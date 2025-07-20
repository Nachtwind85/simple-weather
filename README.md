# Weather Forecast Dashboard

A quick and easy self-hosted weather forecast dashboard using Open-Meteo data.  
Displays 7-day forecasts with temperature, humidity, and precipitation in 3-hour intervals, plus a detailed view for the current day. Supports multiple cities via configuration.

---

## Features

- 7-day weather forecast with temperature, humidity, and rain visualization  
- Current day overview with hourly data and time marker  
- Multiple cities supported via JSON configuration file  
- Responsive design with Bootstrap and dark mode toggle  
- OpenStreetMap integration with animated rain radar for each city  
- Simple Go backend fetching data from Open-Meteo API  

---

## Configuration

Cities are configured in the `config.json` file with the following format:

```json
[
  {
    "name": "Stendal",
    "lat": "52.6069",
    "lon": "11.8587"
  },
  {
    "name": "Güsen",
    "lat": "52.4167",
    "lon": "11.9167"
  },
  {
    "name": "Wuppertal",
    "lat": "51.2562",
    "lon": "7.1508"
  }
  // add more cities as needed
]
```
Modify or add cities by updating this file before starting the server.

## Build & Run
### Prerequisites
Go 1.24 or higher
Docker (optional, for containerized deployment)

### Running locally
```bash
go run main.go
```

Then open http://localhost:8080 in your browser.

### Build executable
```bash
go build -o weather-server
./weather-server
```

### Using Docker
Build the Docker image:

```bash
docker build -t weather-app .
```

Run the container:
```bash
docker run -p 8080:8080 weather-app
```
Or use the provided docker-compose.yml:

```bash
docker-compose up --build
```

# License
MIT License

# Contact
For questions or suggestions, feel free to open an issue.
