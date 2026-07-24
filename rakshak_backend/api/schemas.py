from pydantic import BaseModel, Field, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DetectionEvent(BaseModel):
    species: str = "unknown"
    confidence: float = Field(ge=0.0, le=1.0)

class DeviceCreate(BaseModel):
    device_id: str
    location_name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    highway_km_marker: float | None = None