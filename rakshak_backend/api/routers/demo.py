
from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_user, get_current_device

router = APIRouter(prefix="/demo", tags=["demo"])

# In-memory command queue for the Raspberry Pi
pending_commands = {}

# Dashboard triggers this endpoint
@router.post("/start")
def start_demo(current_user: dict = Depends(get_current_user)):
    device_id = "pi_003"

    # Prevent duplicate demo triggers while one is pending
    if pending_commands.get(device_id):
        raise HTTPException(
            status_code=409,
            detail="A demo command is already pending"
        )

    pending_commands[device_id] = {
        "command": "run_demo",
        "duration": 30
    }

    return {
        "status": "queued",
        "device_id": device_id,
        "message": "Demo command sent to Raspberry Pi"
    }


# Raspberry Pi polls this endpoint
@router.get("/command")
def get_demo_command(device: dict = Depends(get_current_device)):
    device_id = device["device_id"]

    command = pending_commands.pop(device_id, None)

    if command:
        return command

    return {"command": "none"}
