import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import bcrypt
import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

try:
    from .config import load_local_env
    from .database import get_db
    from .models import User
    from .password_validation import validate_password_strength
    from .schemas import AuthResponse, LoginRequest, RegisterRequest
except ImportError as exc:
    if "attempted relative import" not in str(exc):
        raise
    from config import load_local_env
    from database import get_db
    from models import User
    from password_validation import validate_password_strength
    from schemas import AuthResponse, LoginRequest, RegisterRequest


load_local_env()

router = APIRouter()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
OAUTH_STATE_EXPIRE_MINUTES = int(os.getenv("OAUTH_STATE_EXPIRE_MINUTES", "10"))
OAUTH_ALLOWED_REDIRECT_ORIGINS = {
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "OAUTH_ALLOWED_REDIRECT_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
}

OAUTH_PROVIDERS = {
    "google": {
        "client_id_env": "GOOGLE_CLIENT_ID",
        "client_secret_env": "GOOGLE_CLIENT_SECRET",
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
    },
    "github": {
        "client_id_env": "GITHUB_CLIENT_ID",
        "client_secret_env": "GITHUB_CLIENT_SECRET",
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "emails_url": "https://api.github.com/user/emails",
        "scope": "read:user user:email",
    },
}

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required.")


def hash_secret(secret: str) -> str:
    # Passwords and PINs are never stored directly; only salted bcrypt hashes are saved.
    return bcrypt.hashpw(secret.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_secret(secret: str, hashed_secret: str) -> bool:
    return bcrypt.checkpw(secret.encode("utf-8"), hashed_secret.encode("utf-8"))


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def build_auth_response(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user), user=user)


def _get_provider_config(provider: str) -> dict:
    provider_config = OAUTH_PROVIDERS.get(provider)
    if not provider_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider.")

    client_id = os.getenv(provider_config["client_id_env"])
    client_secret = os.getenv(provider_config["client_secret_env"])
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider.title()} OAuth is not configured.",
        )

    return {**provider_config, "client_id": client_id, "client_secret": client_secret}


def _api_mount_prefix(request: Request) -> str:
    path = request.url.path
    return "/api/auth" if path.startswith("/api/auth") else "/auth"


def _callback_url(request: Request, provider: str) -> str:
    public_backend_origin = os.getenv("OAUTH_BACKEND_ORIGIN")
    origin = public_backend_origin.rstrip("/") if public_backend_origin else str(request.base_url).rstrip("/")
    callback_prefix = os.getenv("OAUTH_CALLBACK_PREFIX") or _api_mount_prefix(request)
    return f"{origin}{callback_prefix}/oauth/{provider}/callback"


def _frontend_callback_url(redirect_origin: str | None) -> str:
    configured_url = os.getenv("OAUTH_FRONTEND_CALLBACK_URL")
    if configured_url:
        return configured_url

    origin = (redirect_origin or "").strip().rstrip("/")
    if origin and origin in OAUTH_ALLOWED_REDIRECT_ORIGINS:
        return f"{origin}/oauth/callback"

    fallback_origin = next(iter(OAUTH_ALLOWED_REDIRECT_ORIGINS), "http://localhost:5173")
    return f"{fallback_origin}/oauth/callback"


def _encode_oauth_state(provider: str, frontend_callback_url: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OAUTH_STATE_EXPIRE_MINUTES)
    return jwt.encode(
        {
            "provider": provider,
            "frontend_callback_url": frontend_callback_url,
            "nonce": secrets.token_urlsafe(16),
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def _decode_oauth_state(state_token: str, provider: str) -> dict:
    try:
        state_payload = jwt.decode(state_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state.") from exc

    if state_payload.get("provider") != provider:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth provider mismatch.")
    return state_payload


def _oauth_error_redirect(frontend_callback_url: str, message: str) -> RedirectResponse:
    return RedirectResponse(f"{frontend_callback_url}?{urlencode({'error': message})}")


def _slug_account_name(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip().lower())
    normalized = normalized.strip(".-_")
    if len(normalized) < 3:
        normalized = f"user-{normalized}" if normalized else "user"
    return normalized[:40]


def _unique_account_name(db: Session, email: str, preferred_name: str | None) -> str:
    email_prefix = email.split("@", 1)[0]
    base = _slug_account_name(preferred_name or email_prefix)
    candidate = base[:40]
    suffix = 1

    while db.query(User).filter(User.account_name == candidate).first():
        suffix_text = f"-{suffix}"
        candidate = f"{base[:40 - len(suffix_text)]}{suffix_text}"
        suffix += 1

    return candidate


async def _exchange_oauth_code(provider: str, provider_config: dict, code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        token_response = await client.post(
            provider_config["token_url"],
            data={
                "client_id": provider_config["client_id"],
                "client_secret": provider_config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        token_response.raise_for_status()
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth token exchange failed.")

        user_response = await client.get(
            provider_config["userinfo_url"],
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        user_response.raise_for_status()
        user_data = user_response.json()

        if provider == "github":
            emails_response = await client.get(
                provider_config["emails_url"],
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            emails_response.raise_for_status()
            user_data["emails"] = emails_response.json()

    return user_data


def _oauth_profile(provider: str, user_data: dict) -> tuple[str, str]:
    if provider == "google":
        email = (user_data.get("email") or "").lower()
        if not email or not user_data.get("email_verified"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email is not verified.")
        return email, user_data.get("name") or email.split("@", 1)[0]

    primary_email = next(
        (
            item.get("email")
            for item in user_data.get("emails", [])
            if item.get("primary") and item.get("verified") and item.get("email")
        ),
        None,
    )
    email = (primary_email or "").lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub did not return a verified primary email.",
        )
    return email, user_data.get("name") or user_data.get("login") or email.split("@", 1)[0]


def _get_or_create_oauth_user(db: Session, email: str, full_name: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is disabled.")
        return user

    random_password = secrets.token_urlsafe(32)
    random_pin = f"{secrets.randbelow(10000):04d}"
    user = User(
        full_name=full_name[:120] or email.split("@", 1)[0],
        account_name=_unique_account_name(db, email, full_name),
        email=email,
        password_hash=hash_secret(random_password),
        pin_hash=hash_secret(random_pin),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = f"{payload.account_name}@kabaw.net"
    password_validation = validate_password_strength(
        payload.password,
        username=payload.account_name,
        email=email,
    )
    if not password_validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=password_validation.message,
        )

    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            full_name=payload.full_name,
            account_name=payload.account_name,
            email=email,
            # Hash only after all validation and uniqueness checks have passed.
            password_hash=hash_secret(payload.password),
            pin_hash=hash_secret(payload.pin),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return build_auth_response(user)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create account because the database is unavailable.",
        ) from exc


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to log in because the database is unavailable.",
        ) from exc

    if not user or not verify_secret(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    return build_auth_response(user)


@router.get("/oauth/{provider}/start")
def start_oauth(
    provider: str,
    request: Request,
    redirect_origin: str | None = Query(default=None),
):
    provider_config = _get_provider_config(provider)
    redirect_uri = _callback_url(request, provider)
    frontend_callback_url = _frontend_callback_url(redirect_origin)
    state_token = _encode_oauth_state(provider, frontend_callback_url)
    authorization_params = {
        "client_id": provider_config["client_id"],
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": provider_config["scope"],
        "state": state_token,
    }

    if provider == "google":
        authorization_params["prompt"] = "select_account"

    return RedirectResponse(f"{provider_config['authorize_url']}?{urlencode(authorization_params)}")


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    fallback_callback_url = _frontend_callback_url(None)
    if error:
        return _oauth_error_redirect(fallback_callback_url, error)
    if not code or not state:
        return _oauth_error_redirect(fallback_callback_url, "Missing OAuth callback parameters.")

    state_payload = _decode_oauth_state(state, provider)
    frontend_callback_url = state_payload["frontend_callback_url"]
    provider_config = _get_provider_config(provider)

    try:
        user_data = await _exchange_oauth_code(provider, provider_config, code, _callback_url(request, provider))
        email, full_name = _oauth_profile(provider, user_data)
        user = _get_or_create_oauth_user(db, email, full_name)
        auth_response = build_auth_response(user).model_dump()
    except httpx.HTTPError:
        return _oauth_error_redirect(frontend_callback_url, "Unable to verify OAuth account.")
    except SQLAlchemyError:
        db.rollback()
        return _oauth_error_redirect(frontend_callback_url, "Unable to save OAuth account.")
    except HTTPException as exc:
        return _oauth_error_redirect(frontend_callback_url, str(exc.detail))

    callback_params = urlencode(
        {
            "access_token": auth_response["access_token"],
            "token_type": auth_response["token_type"],
            "user": json.dumps(auth_response["user"]),
        }
    )
    return RedirectResponse(f"{frontend_callback_url}#{callback_params}")
