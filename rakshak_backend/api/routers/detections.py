from fastapi import APIRouter, HTTPException, Depends
from deps import get_current_user, get_current_device
from db import get_db
from schemas import DetectionEvent
from routers.ws import manager

router = APIRouter(prefix="/detections", tags=["detections"])

@router.post("", status_code=201)
async def create_detection(
    event: DetectionEvent,
    device: dict = Depends(get_current_device),
):
    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO detections (device_id, species, confidence, latitude, longitude)
               VALUES (?, ?, ?, ?, ?)""",
            (device["device_id"], event.species, event.confidence,
             event.latitude, event.longitude),
        )
        conn.commit()
        new_id = cursor.lastrowid
    finally:
        conn.close()

    alert = {
        "id": new_id,
        "device_id": device["device_id"],
        "species": event.species,
        "confidence": event.confidence,
        "latitude": event.latitude,
        "longitude": event.longitude,
    }
    await manager.broadcast(alert)
    return alert