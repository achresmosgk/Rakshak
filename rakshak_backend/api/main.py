
import sqlite3
from fastapi import FastAPI
from pydantic import BaseModel,Field
from fastapi import HTTPException


app = FastAPI()

def get_db():
    conn = sqlite3.connect("nilgai.db")
    conn.row_factory = sqlite3.Row   # lets us read columns by name
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            species TEXT NOT NULL,
            confidence REAL NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Detection(BaseModel):
    device_id: str
    species: str = "unknown"
    confidence: float = Field(ge=0.0, le=1.0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    

@app.get("/")
def health_check():
    return {"status":"alive","project":"nilgai_alert"}
@app.get("/status")
def status():
    return{"project":"nilgai","ready":True}

@app.post("/detections",status_code=201)
def create_detection(event:Detection):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO detections (device_id, species, confidence, latitude, longitude)
           VALUES (?, ?, ?, ?, ?)""",
        (event.device_id, event.species, event.confidence, event.latitude, event.longitude),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, **event.model_dump()}
    
@app.get("/detections")
def list_detections():
    conn = get_db()
    rows = conn.execute("SELECT * FROM detections ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/detections/{detection_id}")
def get_detection(detection_id: int):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM detections WHERE id = ?", (detection_id,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Detection not found")
    return dict(row)

class DeviceCreate(BaseModel):
    device_id: str
    location_name: str
    highway_km_marker: float | None = None

@app.post("/devices", status_code=201)
def register_device(device: DeviceCreate):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO devices (device_id, location_name, highway_km_marker) VALUES (?, ?, ?)",
            (device.device_id, device.location_name, device.highway_km_marker),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Device already registered")
    conn.close()
    return device

@app.get("/devices")
def list_devices():
    conn = get_db()
    rows = conn.execute("SELECT * FROM devices ORDER BY device_id").fetchall()
    conn.close()
    return [dict(row) for row in rows]