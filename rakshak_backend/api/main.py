from fastapi import FastAPI

from db import init_db
from routers.detections import router as detections_router
from routers.devices import router as devices_router
from routers.users import router as users_router
from routers.ws import router as ws_router

app = FastAPI(title="Nilgai Alert API")

init_db()

app.include_router(detections_router)
app.include_router(devices_router)
app.include_router(users_router)
app.include_router(ws_router)

@app.get("/health")
def health():
    return {"status": "ok"}