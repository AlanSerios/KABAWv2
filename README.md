# 🐃 KABAWv2: Live Agricultural Weather & Typhoon Monitoring

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

KABAWv2 is a modern, real-time agricultural monitoring and typhoon tracking dashboard. Built specifically for farmers and agricultural stakeholders, it provides critical live weather insights, predictive storm tracking, and interactive data visualization wrapped in a premium glassmorphic UI.

---

## ✨ Key Features

- **Live Interactive Map:** High-performance, full-screen map powered by React-Leaflet.
- **Real-Time Typhoon Tracking:** Fetches live data from the **GDACS API** to plot active Tropical Cyclones, Typhoons, and Low Pressure Areas (LPAs).
- **Predictive Storm Trajectories:** Plots forecast cones and historical tracks for active storms, allowing users to select individual timeline nodes to see wind speeds and severity predictions.
- **Live Weather & Rain Radar:** Integrates **RainViewer API** to overlay live precipitation radar loops directly onto the map.
- **Farm Data Dashboard:** Interactive charts (via Recharts) displaying 24h trends for air quality and farm health.
- **Premium Glassmorphic UI:** A stunning, modern, semi-transparent user interface with smooth animations and dynamic interactions.
- **Auto-Syncing:** The dashboard automatically polls for the latest typhoon coordinates and radar frames every 60 seconds.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 + Vite
- **Mapping:** Leaflet & React-Leaflet
- **Data Visualization:** Recharts
- **Styling:** Vanilla CSS (Glassmorphism, CSS Variables, Flexbox)
- **Live Data Sources & APIs Integration:**
  - **GDACS API (Global Disaster Alert and Coordination System):** We utilize the GDACS REST API to fetch real-time, global disaster alerts. Specifically, we parse their JSON feeds to extract live coordinates, severity ratings, wind speeds, and historical/forecasted trajectory paths for Tropical Cyclones and Low Pressure Areas (LPAs).
  - **RainViewer API:** Used to fetch the latest global weather radar frames. We poll this API to get real-time precipitation tile layers, allowing us to overlay live rain intensity animations directly onto the Leaflet map.
  - **NOAA GFS (Global Forecast System):** We built a custom Node.js pipeline to download and parse GFS wind GRIB2 files, converting them into JSON vectors to visualize global wind patterns.

---

## 🚀 Getting Started

To run this project locally:

### 1. Clone the repository
```bash
git clone https://github.com/AlanSerios/KABAWv2.git
cd KABAWv2
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`.

---

## 💡 How It Works

1. **Map Layer (`LiveMapView.jsx`):** Serves as the base component, managing the state for the currently active storm and selected nodes.
2. **Typhoon Layer (`TyphoonTrackerLayer.jsx`):** Parses GDACS API data and renders animated pulsing markers, polylines, and data tooltips.
3. **Sidebar (`TyphoonDetailsSidebar.jsx`):** Presents a synchronized table of timeline events for the active storm. Clicking a row on the table pans the map directly to that point in the storm's trajectory.
4. **Dashboard (`DashboardView.jsx`):** A sleek glassmorphic overlay displaying farming metrics and chart data.

---

*Built with ❤️ for the Hackathon*
