import requests
import config

def send_detection(species: str, confidence: float, lat: float, lon: float):
    try:
        response = requests.post(
            f"{config.API_BASE}/detections",
            headers={"X-API-Key": config.API_KEY},
            json={
                "species": species,
                "confidence": confidence,
                "latitude": lat,
                "longitude": lon,
            },
            timeout=5,
        )
        response.raise_for_status()
        print(f"✅ sent: {species} ({confidence})")
        return True
    except requests.exceptions.RequestException as e:
        print(f"⚠️ failed to send: {e}")
        return False

if __name__ == "__main__":
    send_detection("nilgai", 0.92, 21.17, 72.83)