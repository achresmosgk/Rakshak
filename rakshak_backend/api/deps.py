from fastapi import Header, HTTPException
from db import get_db

def get_current_user(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing token")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = parts[1]

    conn = get_db()
    row = conn.execute(
        """SELECT users.id, users.name, users.email
           FROM tokens JOIN users ON users.id = tokens.user_id
           WHERE tokens.token = ?""",
        (token,),
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return dict(row)