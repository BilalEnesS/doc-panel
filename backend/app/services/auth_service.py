"""
Authentication service for business logic
"""

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import timedelta
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.schemas.auth import UserSignupRequest, UserLoginRequest
from app.models.user import User


class AuthService:
    """Authentication service class"""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize auth service
        
        Args:
            session: Database session
        """
        self.session = session
        self.user_repository = UserRepository(session)
    
    async def signup(self, signup_data: UserSignupRequest) -> tuple[User, str]:
        """
        Register a new user
        
        Args:
            signup_data: User signup data
            
        Returns:
            Tuple of (User object, access token)
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        if await self.user_repository.email_exists(signup_data.email):
            raise ValueError("Email already registered")
        
        # Hash password
        password_hash = get_password_hash(signup_data.password)
        
        # Create user data
        user_data = {
            "email": signup_data.email,
            "password_hash": password_hash,
            "first_name": signup_data.first_name,
            "last_name": signup_data.last_name,
        }
        
        # Create user
        user = await self.user_repository.create(user_data)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value}
        )
        
        return user, access_token
    
    async def login(self, login_data: UserLoginRequest) -> tuple[User, str]:
        """
        Authenticate user and return token
        
        Args:
            login_data: User login data
            
        Returns:
            Tuple of (User object, access token)
            
        Raises:
            ValueError: If email or password is invalid
        """
        # Get user by email
        user = await self.user_repository.get_by_email(login_data.email)
        
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value}
        )
        
        return user, access_token
    
    async def get_current_user(self, user_id: int) -> Optional[User]:
        """
        Get current user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None
        """
        return await self.user_repository.get_by_id(user_id)

