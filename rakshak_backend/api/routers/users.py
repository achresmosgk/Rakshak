import sqlite3
from fastapi import APIRouter, HTTPException

from db import get_db
from schemas import UserCreate, UserLogin

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", status_code=201)
def create_user(user: UserCreate):
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (user.name, user.email, user.password),
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

    if credentials.password != row["password"]:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"message": "logged in", "user_id": row["id"], "name": row["name"]}