from fastapi import FastAPI

from db import init_db
from routers import detections, devices

app = FastAPI(title="Nilgai Alert API")

init_db()

app.include_router(detections.router)
app.include_router(devices.router)

@app.get("/health")
def health():
    return {"status": "ok"}