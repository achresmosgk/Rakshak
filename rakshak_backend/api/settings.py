import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
DATABASE_PATH = os.environ.get("DATABASE_PATH", "nilgai.db")

# There's exactly one admin — a fixed identity from config, not a signed-up
# user, so there's no admin signup flow.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@rakshak.app")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme-admin-pass")

# Comma-separated list of allowed frontend origins, e.g. "https://rakshak.app,https://www.rakshak.app"
_cors_origins = os.environ.get("CORS_ORIGINS", "*")
CORS_ORIGINS = [o.strip() for o in _cors_origins.split(",")] if _cors_origins != "*" else ["*"]
