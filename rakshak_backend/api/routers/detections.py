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
             device["latitude"], device["longitude"]),
        )
        conn.commit()
        new_id = cursor.lastrowid
    finally:
        conn.close()

    alert = {
        "id": new_id,
        "device_id": device["device_id"],
        "location_name": device["location_name"],
        "species": event.species,
        "confidence": event.confidence,
        "latitude": device["latitude"],
        "longitude": device["longitude"],
    }
    await manager.broadcast(alert)
    return alert

@router.get("")
def list_detections(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM detections ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{detection_id}")
def get_detection(detection_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM detections WHERE id = ?", (detection_id,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Detection not found")
    return dict(row)