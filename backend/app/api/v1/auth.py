"""
Authentication API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    UserWithTokenResponse,
    UserResponse,
    TokenResponse
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/signup", response_model=UserWithTokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    signup_data: UserSignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    
    Args:
        signup_data: User signup data
        db: Database session
        
    Returns:
        User with access token
        
    Raises:
        HTTPException: If email already exists
    """
    auth_service = AuthService(db)
    
    try:
        user, access_token = await auth_service.signup(signup_data)
        
        return UserWithTokenResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                role=user.role.value,
                created_at=user.created_at
            ),
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=UserWithTokenResponse)
async def login(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return token
    
    Args:
        login_data: User login data
        db: Database session
        
    Returns:
        User with access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    auth_service = AuthService(db)
    
    try:
        user, access_token = await auth_service.login(login_data)
        
        return UserWithTokenResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                role=user.role.value,
                created_at=user.created_at
            ),
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout")
async def logout():
    """
    Logout user (client should delete token)
    
    Returns:
        Success message
    """
    return {"message": "Successfully logged out"}

