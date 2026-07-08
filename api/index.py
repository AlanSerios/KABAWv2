import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="KABAW V2 API")

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to KABAW V2 API"}

class NodeData(BaseModel):
    lat: float
    lng: float
    soilMoisture: float | None = None
    soilTemp: float | None = None
    nearestTyphoon: dict | None = None
    nearestFire: dict | None = None
    nearestEarthquake: dict | None = None
    airQuality: float | None = None

@app.post("/api/advisor")
def get_advisor(data: NodeData):
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        return {"advisory": "### Analysis Pending\n\n**API Key missing.** Please add your `FIREWORKS_API_KEY` to the `api/.env` file to generate real-time AI agricultural advisories based on this node's environmental data."}
    
    prompt = f"""
You are an expert Agricultural & Environmental Advisor. 
Analyze the following data for a farm node located at {data.lat}, {data.lng}:
- Soil Moisture: {data.soilMoisture}%
- Soil Temperature: {data.soilTemp}°C
- Air Quality Index: {data.airQuality}
- Nearest Typhoon: {data.nearestTyphoon}
- Nearest Wildfire: {data.nearestFire}
- Nearest Earthquake: {data.nearestEarthquake}

Provide a concise, highly professional, actionable advisory for the farmer in Markdown format. 
Structure it clearly with headings. Do not use generic filler words like "Elevate" or "Seamless". 
Be specific about the threats and the exact actions the farmer must take based on the provided metrics.
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "accounts/fireworks/models/llama-v3p1-70b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
        "temperature": 0.2
    }
    
    try:
        response = requests.post("https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return {"advisory": result["choices"][0]["message"]["content"]}
    except Exception as e:
        return {"error": str(e), "advisory": f"### AI Generation Failed\nCould not reach Fireworks API. Error: {str(e)}"}
