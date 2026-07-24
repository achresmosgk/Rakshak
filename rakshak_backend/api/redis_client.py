import redis  # type: ignore[import]

from settings import REDIS_URL

client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def revoke_jti(jti: str, ttl_seconds: int) -> None:
    if ttl_seconds > 0:
        client.setex(f"revoked:{jti}", ttl_seconds, "1")

def is_revoked(jti: str) -> bool:
    return client.exists(f"revoked:{jti}") == 1