
# Mini Smart Farm

A full-stack smart farm management system built as a collaboration between **Pennsylvania State University (PSU)** and **Belgium Campus ITVersity**. The platform provides real-time IoT monitoring, AI-powered detection, and farm management tools across five modules: Chicken Coop, Crop Farm, Power Generation, and Water Distribution, integration management

---

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

The backend API server lives in `Backend - Database connection/`. Run it separately:

```bash
cd "Backend - Database connection"
npm install
npm start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router 7 |
| Styling | Tailwind CSS + Radix UI |
| Charts | Recharts |
| Forms | React Hook Form |
| Backend | Node.js + Express 5 + TypeScript |
| Database | MySQL 8 |
| Auth | bcrypt |
| Real-time | MQTT |
| Hardware | Raspberry Pi (camera + sensors) |

---

## Features

### Chicken Coop Tile

The chicken coop module is the most feature-rich tile. It covers everything from individual chicken management to AI-powered predator detection.

#### AI Predator Detection & Live Feed
- A Raspberry Pi camera streams a live video feed viewable directly on the Chicken Dashboard
- An AI model runs on the stream to detect predators in real time, logging each incident with a timestamp and a confidence score
- The dashboard displays a predator detection history chart so the farm owner can identify patterns (e.g. time of day, frequency)

#### Chicken Dashboard
The main overview screen for the coop. It shows:
- **KPI cards** — total chickens, weekly egg production, predator incidents, and movement activity
- **Egg production chart** — trend line of eggs collected over time
- **Predator detection chart** — incidents plotted over time
- **Movement chart** — activity patterns across the flock
- Export data to CSV and clear historical data

#### Egg & Waste Logging
- The farm owner can log eggs collected per chicken with the date and count
- Waste (manure) collection is logged with weight (kg), date, and optional notes
- A cleaning reminder shows the next scheduled cleaning due date
- A built-in fertilizer guide outlines steps for converting collected waste into fertilizer

#### Door Control
- The coop door can be monitored and controlled directly from the website
- The farm owner can set automated open/close times (e.g. open at sunrise, close at sunset)
- Manual overrides are supported from the dashboard

#### Chicken Profiles
- Each chicken is registered with an RFID tag as its unique identifier
- Profile data includes name, gender, date of birth, species, weight, and an image
- Individual health logs record observations and actions taken per chicken

#### Coop Management
- Multiple coops can be registered, each with capacity and zone information
- Door schedules and cleaning reminders are configured per coop

---

### Crop Farm Tile
- Track crop plantings through their full lifecycle (planted → growing → ready to harvest → harvested)
- Sensor readings per planting: soil moisture, temperature, humidity, EC (electrical conductivity), and NPK levels
- AI disease detection on crop images with confidence scoring
- Harvest recording with yield and quality data

---

### Power Generation Tile
- Monitor solar panel output and battery charge levels in real time
- View hourly solar generation data and power output logs per device/zone
- Battery percentage tracking across the farm's battery bank

---

### Water Distribution Tile
- Monitor water sources (borehole, reservoir, rainwater, municipal, river)
- View sensor readings: water depth, turbidity, and flow rate
- Open and close distribution valves directly from the website

---

### Hub / Main Dashboard
- Farm-wide overview with weather, power status, water levels, and chicken KPIs
- User authentication with role-based access (student, faculty, researcher, administrator, community, observer)

---

## Database

The full MySQL schema is in [smart_farm_schema_MySQL.sql](smart_farm_schema_MySQL.sql).

Key tables:

| Module | Tables |
|---|---|
| Users | `users`, `roles`, `farms` |
| Chicken Coop | `coops`, `chickens`, `chickenEggs`, `coopActivityLogs`, `coopCleaningLogs`, `animalHealthLogs`, `predatorLog` |
| Crop Farm | `fields`, `crops`, `cropPlantings`, `cropSensorReadings`, `cropImages`, `cropAiPredictions`, `harvestRecords` |
| Power | `solarPanel`, `solarReadings`, `batteries`, `batteryLevels`, `powerOutputLogs` |
| Water | `waterSources`, `waterDistributionNodes`, `waterSensorReadings` |
| General | `devices`, `farmZones`, `tiles`, `tileMessages` |

---

## Project Structure

```
Mini-Smart-Farm/
├── src/
│   └── app/
│       ├── components/
│       │   └── chickenComponents/   # All chicken coop UI components
│       └── screens/
│           ├── hub-tile/            # Main dashboard + auth
│           ├── coop-tile/           # Chicken coop screens
│           ├── crop-tile/           # Crop farm screens
│           ├── power-tile/          # Power generation screens
│           └── water-tile/          # Water distribution screens
├── Backend - Database connection/   # Express API server
├── public/                          # Static assets
├── smart_farm_schema_MySQL.sql      # Database schema
└── guidelines/                      # Project documentation
```

---

## About

This project is a collaboration between **Pennsylvania State University (PSU)** and **Belgium Campus ITVersity**, combining academic research with practical IoT and AI implementation on a working smart farm.
