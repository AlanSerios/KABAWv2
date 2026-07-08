import re

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


ACCOUNT_NAME_RE = re.compile(r"^[a-zA-Z0-9._-]{3,40}$")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    account_name: str = Field(..., min_length=3, max_length=40)
    pin: str = Field(..., min_length=4, max_length=4)
    password: str = Field(..., min_length=1, max_length=128)
    confirm_password: str = Field(..., min_length=1, max_length=128)

    @field_validator("full_name", "account_name")
    @classmethod
    def strip_text(cls, value):
        return value.strip()

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value):
        if len(value) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return value

    @field_validator("account_name")
    @classmethod
    def validate_account_name(cls, value):
        if not ACCOUNT_NAME_RE.fullmatch(value):
            raise ValueError("Account name can only use letters, numbers, dots, underscores, or hyphens.")
        return value.lower()

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, value):
        if not value.isdigit():
            raise ValueError("Security PIN must be exactly 4 digits.")
        return value

    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.lower()


class UserResponse(BaseModel):
    id: int
    full_name: str
    account_name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
