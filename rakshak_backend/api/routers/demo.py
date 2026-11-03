
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_user, get_current_device
from routers.ws import manager

router = APIRouter(prefix="/demo", tags=["demo"])

pending_commands = {}
demo_running = set()


@router.post("/start")
async def start_demo(current_user: dict = Depends(get_current_user)):
    device_id = "pi_003"

    if device_id in demo_running:
        raise HTTPException(
            status_code=409,
            detail="Demo is already running",
        )

    demo_running.add(device_id)

    pending_commands[device_id] = {
        "command": "run_demo",
        "duration": 30,
    }

    # Notify dashboard immediately
    await manager.broadcast({
        "event_type": "demo_started",
        "id": f"demo-{device_id}",
        "device_id": device_id,
        "species": "large_mammal",
        "confidence": 0.99,
        "is_demo": True,
    })

    # Automatically clear after 30 seconds
    asyncio.create_task(finish_demo(device_id))

    return {
        "status": "started",
        "device_id": device_id,
        "duration": 30,
    }


async def finish_demo(device_id: str):
    await asyncio.sleep(30)

    await manager.broadcast({
        "event_type": "road_clear",
        "device_id": device_id,
        "is_demo": True,
    })

    demo_running.discard(device_id)


@router.get("/command")
def get_demo_command(device: dict = Depends(get_current_device)):
    device_id = device["device_id"]

    command = pending_commands.pop(device_id, None)

    return command or {"command": "none"}
