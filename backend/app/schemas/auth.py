"""
Authentication schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserSignupRequest(BaseModel):
    """User signup request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class UserLoginRequest(BaseModel):
    """User login request schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithTokenResponse(BaseModel):
    """User with token response schema"""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

