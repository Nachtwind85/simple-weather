# --- Build Stage ---
FROM golang:1.24 AS builder

WORKDIR /app
COPY . .

# Optional, aber hilfreich
RUN go mod tidy

# Statisch kompilieren (vermeidet GLIBC-Probleme)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o weather-server

# --- Runtime Stage ---
FROM debian:bullseye-slim

# Installiere SSL-Zertifikate, Zeitzonen und Locales
RUN apt-get update && apt-get install -y \
    ca-certificates \
    tzdata \
    locales \
 && rm -rf /var/lib/apt/lists/*

# Setze gewünschte Locale und Zeitzone
ENV LANG=de_DE.UTF-8
RUN sed -i 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen \
 && locale-gen

ENV TZ=Europe/Berlin

WORKDIR /app

# Binary und Dateien kopieren
COPY --from=builder /app/weather-server .
COPY static/ ./static/
COPY templates/ ./templates/
COPY config.json .

# Port öffnen
EXPOSE 8080

# Ausführen
ENTRYPOINT ["./weather-server"]
