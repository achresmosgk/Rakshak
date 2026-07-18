from fastapi import Header, HTTPException
from db import get_db
import jwt
from fastapi import Header, HTTPException
from db import get_db
from utils import decode_access_token

def get_current_user(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing token")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid auth header")

    try:
        payload = decode_access_token(parts[1])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload["sub"])
    conn = get_db()
    row = conn.execute(
        "SELECT id, name, email FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(row)

def get_current_device(x_api_key: str = Header(None)):
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing API key")

    conn = get_db()
    row = conn.execute(
        "SELECT id, device_id, location_name FROM devices WHERE api_key = ?", (x_api_key,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return dict(row)