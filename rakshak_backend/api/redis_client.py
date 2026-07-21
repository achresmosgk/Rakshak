import redis  # type: ignore[import]

client = redis.Redis(host="localhost", port=6379, decode_responses=True)

def revoke_jti(jti: str, ttl_seconds: int) -> None:
    if ttl_seconds > 0:
        client.setex(f"revoked:{jti}", ttl_seconds, "1")

def is_revoked(jti: str) -> bool:
    return client.exists(f"revoked:{jti}") == 1