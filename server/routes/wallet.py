from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from auth_middleware import get_current_user
from wallet_tool import WalletTool

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize wallet tool globally
wallet_tool = WalletTool()

class ReceiptPassRequest(BaseModel):
    merchant_name: str
    total_amount: str
    date: str
    receipt_id: Optional[str] = None
    hero_image_url: Optional[str] = None

class CustomPassRequest(BaseModel):
    title: str
    header: str
    description: str
    barcode_value: str
    background_color: Optional[str] = "#4285f4"
    hero_image_url: Optional[str] = None
    logo_image_url: Optional[str] = None
    app_link_url: Optional[str] = None

class WalletPassResponse(BaseModel):
    success: bool
    save_link: Optional[str] = None
    class_id: Optional[str] = None
    object_id: Optional[str] = None
    receipt_id: Optional[str] = None
    error: Optional[str] = None

@router.get("/status")
async def get_wallet_status():
    """Get the status of the Google Wallet integration."""
    try:
        is_ready = wallet_tool.is_ready()
        return {
            "status": "ready" if is_ready else "not_configured",
            "message": "Google Wallet API is ready" if is_ready else "Google Wallet API not configured"
        }
    except Exception as e:
        logger.error(f"Error checking wallet status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-receipt-pass", response_model=WalletPassResponse)
async def create_receipt_pass(
    request: ReceiptPassRequest,
    user: dict = Depends(get_current_user)
) -> WalletPassResponse:
    """Create a Google Wallet pass for a receipt."""
    try:
        logger.info(f"Creating receipt pass for user {user['uid']}")
        
        # Convert request to receipt data
        receipt_data = {
            "merchant_name": request.merchant_name,
            "total_amount": request.total_amount,
            "date": request.date,
            "receipt_id": request.receipt_id,
            "hero_image_url": request.hero_image_url
        }
        
        # Create the pass
        result = wallet_tool.create_receipt_pass(receipt_data)
        
        logger.info(f"Receipt pass creation result: {result}")
        
        return WalletPassResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating receipt pass: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-custom-pass", response_model=WalletPassResponse)
async def create_custom_pass(
    request: CustomPassRequest,
    user: dict = Depends(get_current_user)
) -> WalletPassResponse:
    """Create a custom Google Wallet pass."""
    try:
        logger.info(f"Creating custom pass for user {user['uid']}")
        
        # Create the pass
        result = wallet_tool.create_custom_pass(
            title=request.title,
            header=request.header,
            description=request.description,
            barcode_value=request.barcode_value,
            background_color=request.background_color,
            hero_image_url=request.hero_image_url,
            logo_image_url=request.logo_image_url,
            app_link_url=request.app_link_url
        )
        
        logger.info(f"Custom pass creation result: {result}")
        
        return WalletPassResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating custom pass: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test-pass")
async def create_test_pass(user: dict = Depends(get_current_user)):
    """Create a test pass for development purposes."""
    try:
        logger.info(f"Creating test pass for user {user['uid']}")
        
        test_receipt = {
            "merchant_name": "Raseed Test Store",
            "total_amount": "29.99",
            "date": "2025-07-27",
            "receipt_id": f"TEST_{user['uid'][:8]}",
            "hero_image_url": "https://via.placeholder.com/800x400/4285f4/ffffff?text=Test+Receipt"
        }
        
        result = wallet_tool.create_receipt_pass(test_receipt)
        
        if result['success']:
            return {
                "message": "Test pass created successfully",
                "save_link": result['save_link'],
                "pass_details": result
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Error creating test pass: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
