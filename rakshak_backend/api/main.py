from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from settings import CORS_ORIGINS
from routers.admin import router as admin_router
from routers.detections import router as detections_router
from routers.devices import router as devices_router
from routers.users import router as users_router
from routers.ws import router as ws_router

app = FastAPI(title="Nilgai Alert API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # Auth is a Bearer token in the Authorization header, not cookies, so no
    # credentialed requests — keeps this compatible with allow_origins=["*"].
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(admin_router)
app.include_router(detections_router)
app.include_router(devices_router)
app.include_router(users_router)
app.include_router(ws_router)

@app.get("/health")
def health():
    return {"status": "ok"}