import sqlite3
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from db import get_db
from schemas import UserCreate, UserLogin
from utils import hash_password, check_password, create_access_token
from deps import get_current_user
from redis_client import revoke_jti

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", status_code=201)
def create_user(user: UserCreate):
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (user.name, user.email, hash_password(user.password)),
        )
        conn.commit()
        new_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()
    return {"id": new_id, "name": user.name, "email": user.email}

@router.post("/login")
def login(credentials: UserLogin):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE email = ?", (credentials.email,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not check_password(credentials.password , row["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(row["id"])

    return {"token": token, "user_id": row["id"], "name": row["name"]}

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    ttl_seconds = int(current_user["exp"] - datetime.now(timezone.utc).timestamp())
    revoke_jti(current_user["jti"], ttl_seconds)
    return {"message": "logged out"}