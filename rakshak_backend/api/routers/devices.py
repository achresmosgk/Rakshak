import sqlite3
from fastapi import APIRouter, HTTPException

from db import get_db
from schemas import DeviceCreate

router=APIRouter(prefix="/devices",tags=["devices"])

@router.post("", status_code=201)
def create_device(event: DeviceCreate):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO devices (device_id, location_name,highway_km_marker)
           VALUES (?, ?, ?)""",
        (event.device_id, event.location_name, event.highway_km_marker),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, **event.model_dump()}

@router.get("")
def list_devices():
    conn = get_db()
    rows = conn.execute("SELECT * FROM devices ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{device_id}")
def get_detection(device_id: int):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM devices WHERE id = ?", (device_id,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return dict(row)