import sqlite3
from fastapi import APIRouter, HTTPException, Depends
import secrets
from db import get_db
from schemas import DeviceCreate
from deps import get_current_admin

router=APIRouter(prefix="/devices",tags=["devices"])

@router.post("", status_code=201)
def create_device(event: DeviceCreate, current_admin: dict = Depends(get_current_admin)):
    api_key = secrets.token_urlsafe(32)
    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO devices
               (device_id, location_name, latitude, longitude, highway_km_marker, api_key)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (event.device_id, event.location_name, event.latitude,
             event.longitude, event.highway_km_marker, api_key),
        )
        conn.commit()
        new_id = cursor.lastrowid
    except sqlite3.IntegrityError as e:
        print(f"⚠️  integrity error: {e}")          # see the real reason
        raise HTTPException(status_code=400, detail="Device already registered")
    finally:
        conn.close()
    return {"id": new_id, "api_key": api_key, **event.model_dump()}

@router.get("")
def list_devices(current_admin: dict = Depends(get_current_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM devices").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{device_id}")
def get_device(device_id: str, current_admin: dict = Depends(get_current_admin)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM devices WHERE device_id = ?", (device_id,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return dict(row)
