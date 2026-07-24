import hmac
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from db import get_db
from schemas import UserLogin
from settings import ADMIN_EMAIL, ADMIN_PASSWORD
from utils import create_admin_token
from deps import get_current_admin
from redis_client import revoke_jti

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login")
def admin_login(credentials: UserLogin):
    email_ok = hmac.compare_digest(credentials.email, ADMIN_EMAIL)
    password_ok = hmac.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (email_ok and password_ok):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"token": create_admin_token()}

@router.post("/logout")
def admin_logout(current_admin: dict = Depends(get_current_admin)):
    ttl_seconds = int(current_admin["exp"] - datetime.now(timezone.utc).timestamp())
    revoke_jti(current_admin["jti"], ttl_seconds)
    return {"message": "logged out"}

@router.get("/users")
def list_users(current_admin: dict = Depends(get_current_admin)):
    conn = get_db()
    rows = conn.execute("SELECT id, name, email, created_at FROM users ORDER BY id").fetchall()
    conn.close()
    return [dict(row) for row in rows]
