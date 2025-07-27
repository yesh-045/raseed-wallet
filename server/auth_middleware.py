# server/auth_middleware.py
# Firebase Authentication middleware for FastAPI

from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()

class AuthMiddleware:
    """Firebase Authentication middleware"""
    
    @staticmethod
    async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """
        Verify Firebase ID token and return decoded user information
        """
        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(credentials.credentials)
            
            # Extract user information
            user_info = {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'firebase': decoded_token
            }
            
            logger.info(f"Successfully authenticated user: {user_info['uid']}")
            return user_info
            
        except auth.InvalidIdTokenError:
            logger.error("Invalid ID token")
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )
        except auth.ExpiredIdTokenError:
            logger.error("Expired ID token")
            raise HTTPException(
                status_code=401,
                detail="Authentication token has expired"
            )
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail="Authentication failed"
            )
    
    @staticmethod
    async def optional_verify_token(request: Request) -> Optional[dict]:
        """
        Optional authentication - doesn't raise error if no token provided
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        try:
            token = auth_header.split(" ")[1]
            decoded_token = auth.verify_id_token(token)
            
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'firebase': decoded_token
            }
        except Exception as e:
            logger.warning(f"Optional auth failed: {str(e)}")
            return None

# Dependency functions for route protection
async def get_current_user(user_info: dict = Depends(AuthMiddleware.verify_token)) -> dict:
    """Get current authenticated user (required)"""
    return user_info

async def get_current_user_optional(user_info: Optional[dict] = Depends(AuthMiddleware.optional_verify_token)) -> Optional[dict]:
    """Get current authenticated user (optional)"""
    return user_info
