from fastapi import FastAPI
from pydantic import BaseModel,Field

app = FastAPI()

class Detection(BaseModel):
    device_id: str
    species: str = "unknown"
    confidence: float = Field(ge=0.0, le=1.0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    
detections=[]
@app.get("/")
def health_check():
    return {"status":"alive","project":"nilgai_alert"}
@app.get("/status")
def status():
    return{"project":"nilgai","ready":True}

@app.post("/detections")
def create_detection(event:Detection):
    stored=event.model_dump()
    stored["id"] = len(detections) + 1
    detections.append(stored)
    return stored
    
@app.get("/detections")
def list_detections():
    return detections