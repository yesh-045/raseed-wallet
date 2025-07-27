from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from routes.insights import router as insights_router
from routes.agent import router as agent_router
from routes.wallet import router as wallet_router
from auth_middleware import get_current_user, get_current_user_optional
from firestore_service import firestore_service
import os
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Raseed API", version="1.0.0")

# Configure CORS with authentication support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefix
app.include_router(insights_router, prefix="/api/insights")
app.include_router(agent_router, prefix="/api/agent")
app.include_router(wallet_router, prefix="/api/wallet")

# Get database reference
db = firestore_service.db

@app.get("/")
async def root():
    return {"message": "Raseed API is running with Google Cloud OAuth"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "auth": "google-oauth"}

class UserProfile(BaseModel):
    name: str = ""
    email: str = ""
    preferred_currency: str = ""
    budget_monthly: int = 0
    created_at: str = ""
    fhs_score: Optional[float] = None
    pantry_enabled: Optional[bool] = None
    price_sensitivity_score: Optional[float] = None
    behavior_summary: Optional[str] = ""
    savings_pct: Optional[float] = None
    uid: Optional[str] = None

class ReceiptProcessRequest(BaseModel):
    receiptId: str
    downloadURL: str
    userId: str
    fileName: str
    fileType: str
    storagePath: Optional[str] = None

class ProcessingResponse(BaseModel):
    success: bool
    processingId: str
    status: str
    message: str
    receiptId: Optional[str] = None
    estimatedCompletionTime: Optional[str] = None

@app.get("/user/{uid}")
async def get_user(uid: str):
    """Get user profile by UID"""
    try:
        user_data = firestore_service.get_user(uid)
        if not user_data:
            return {
                "success": False,
                "error": "User not found",
                **UserProfile().model_dump()
            }
        
        user_data["success"] = True
        return user_data
    except Exception as e:
        print(f"Exception in get_user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/{uid}")
async def update_user(uid: str, profile: UserProfile):
    """Update user profile"""
    try:
        data = profile.model_dump()
        data['uid'] = uid  # Ensure uid is set correctly
        
        success = firestore_service.create_or_update_user(uid, data)
        if success:
            return {"success": True, "uid": uid}
        else:
            raise HTTPException(status_code=500, detail="Failed to update user")
    except Exception as e:
        print(f"Exception in update_user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/receipts/{uid}")
async def get_receipts(uid: str):
    """Get receipts for a user"""
    try:
        receipts = firestore_service.get_user_receipts(uid)
        return {"success": True, "receipts": receipts}
    except Exception as e:
        print(f"Exception in get_receipts: {str(e)}")
        return {"success": False, "error": str(e), "receipts": []}

@app.post("/api/process-receipt")
async def process_receipt(request: ReceiptProcessRequest):
    """Process a receipt using AI"""
    try:
        print(f"Processing receipt: {request.receiptId} for user: {request.userId}")
        
        # Create processing ID
        processing_id = f"proc_{int(time.time())}_{request.receiptId}"
        
        # Store processing request in Firestore for tracking
        processing_data = {
            "processingId": processing_id,
            "receiptId": request.receiptId,
            "userId": request.userId,
            "fileName": request.fileName,
            "downloadURL": request.downloadURL,
            "status": "processing",
            "progress": 0,
            "startedAt": datetime.now().isoformat(),
            "estimatedCompletionTime": datetime.fromtimestamp(time.time() + 60).isoformat()
        }
        
        # Save to Firestore (you can implement this in firestore_service)
        # firestore_service.save_processing_status(processing_id, processing_data)
        
        # TODO: Implement actual AI processing here
        # For now, return success response
        
        return ProcessingResponse(
            success=True,
            processingId=processing_id,
            status="processing",
            message="Receipt submitted for processing. Processing will continue in the background.",
            receiptId=request.receiptId,
            estimatedCompletionTime=processing_data["estimatedCompletionTime"]
        )
        
    except Exception as e:
        print(f"Exception in process_receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/process-status/{receipt_id}")
async def get_processing_status(receipt_id: str):
    """Get processing status for a receipt"""
    try:
        print(f"Getting processing status for receipt: {receipt_id}")
        
        # TODO: Get actual status from database
        # For now, return mock progressive status
        
        import random
        progress = min(100, random.randint(20, 100))
        
        if progress >= 100:
            status = "completed"
            message = "Processing completed successfully"
        else:
            status = "processing"
            message = "Processing in progress..."
        
        return {
            "receiptId": receipt_id,
            "status": status,
            "progress": progress,
            "message": message,
            "updatedAt": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Exception in get_processing_status: {str(e)}")
        return {
            "receiptId": receipt_id,
            "status": "processing",
            "progress": 50,
            "message": "Processing in progress...",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
