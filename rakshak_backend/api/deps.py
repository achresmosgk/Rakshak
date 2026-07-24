from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from db import get_db
from utils import decode_access_token
from redis_client import is_revoked

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if is_revoked(payload["jti"]):
        raise HTTPException(status_code=401, detail="Token revoked")

    user_id = int(payload["sub"])
    conn = get_db()
    row = conn.execute(
        "SELECT id, name, email FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")

    user = dict(row)
    user["jti"] = payload["jti"]
    user["exp"] = payload["exp"]
    return user

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if is_revoked(payload["jti"]):
        raise HTTPException(status_code=401, detail="Token revoked")

    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return {"jti": payload["jti"], "exp": payload["exp"]}

def get_current_device(x_api_key: str = Header(None)):
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing API key")

    conn = get_db()
    row = conn.execute(
        """SELECT id, device_id, location_name, latitude, longitude
           FROM devices WHERE api_key = ?""",
        (x_api_key,),
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return dict(row)