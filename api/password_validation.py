import re
from dataclasses import dataclass


MIN_PASSWORD_LENGTH = 10


@dataclass(frozen=True)
class PasswordValidationResult:
    is_valid: bool
    errors: list[str]

    @property
    def message(self) -> str:
        if self.is_valid:
            return ""
        return "Password does not meet the security requirements: " + "; ".join(self.errors)


def _email_prefix(email: str | None) -> str:
    if not email or "@" not in email:
        return ""
    return email.split("@", 1)[0].strip().lower()


def validate_password_strength(
    password: str,
    *,
    username: str | None = None,
    email: str | None = None,
) -> PasswordValidationResult:
    """Validate registration passwords before hashing or persistence.

    The policy intentionally returns every missed requirement at once so the
    client can show one helpful message instead of forcing trial and error.
    """
    errors: list[str] = []

    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"be at least {MIN_PASSWORD_LENGTH} characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("include at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("include at least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("include at least one number")
    if not re.search(r"[^A-Za-z0-9\s]", password):
        errors.append("include at least one special character")

    normalized_password = password.lower()
    normalized_username = (username or "").strip().lower()
    normalized_email_prefix = _email_prefix(email)

    if normalized_username and normalized_username in normalized_password:
        errors.append("not include your username")
    if normalized_email_prefix and normalized_email_prefix in normalized_password:
        errors.append("not include the part of your email before @")

    return PasswordValidationResult(is_valid=not errors, errors=errors)
