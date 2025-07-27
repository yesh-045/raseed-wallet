from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import sys
import os

# Add the insight_tools directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'insight_tools'))

# Import all insight tools
from fh_s import compute_and_update_fhs
from recurrent_ import analyze_purchase_patterns
from need_want import analyze_spending_classification
from overlap_ import detect_spending_overlaps
from pantry_ import analyze_pantry_patterns
from micro_momen_analysist import analyze_micro_moments

# Remove prefix since it's added in main.py
router = APIRouter(tags=["insights"])

@router.get("/fhs")
async def get_financial_health_score(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get Financial Health Score analysis"""
    try:
        result = compute_and_update_fhs(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing FHS: {str(e)}")

@router.get("/recurring")
async def get_recurring_patterns(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get recurring purchase patterns analysis"""
    try:
        result = analyze_purchase_patterns(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing recurring patterns: {str(e)}")

@router.get("/need-want")
async def get_need_want_analysis(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get need vs want spending analysis"""
    try:
        result = analyze_spending_classification(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing need vs want: {str(e)}")

@router.get("/overlap")
async def get_spending_overlaps(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get spending overlaps and duplicate subscriptions"""
    try:
        result = detect_spending_overlaps(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting overlaps: {str(e)}")

@router.get("/pantry")
async def get_pantry_analysis(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get pantry management and food waste analysis"""
    try:
        result = analyze_pantry_patterns(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing pantry: {str(e)}")

@router.get("/micro-moment")
async def get_micro_moment_analysis(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get micro-moment and impulse spending analysis"""
    try:
        result = analyze_micro_moments(user_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing micro moments: {str(e)}")

@router.get("/all")
async def get_all_insights(
    user_id: str = Query(..., description="User ID"),
    timeRange: str = Query("month", description="Time range for analysis")
):
    """Get all available insights for a user"""
    results = {}
    
    try:
        results["fhs"] = compute_and_update_fhs(user_id)
    except Exception as e:
        results["fhs"] = {"error": str(e)}
    
    try:
        results["recurring"] = analyze_purchase_patterns(user_id)
    except Exception as e:
        results["recurring"] = {"error": str(e)}
    
    try:
        results["need_want"] = analyze_spending_classification(user_id)
    except Exception as e:
        results["need_want"] = {"error": str(e)}
    
    try:
        results["overlap"] = detect_spending_overlaps(user_id)
    except Exception as e:
        results["overlap"] = {"error": str(e)}
    
    try:
        results["pantry"] = analyze_pantry_patterns(user_id)
    except Exception as e:
        results["pantry"] = {"error": str(e)}
    
    try:
        results["micro_moment"] = analyze_micro_moments(user_id)
    except Exception as e:
        results["micro_moment"] = {"error": str(e)}
    
    return JSONResponse(content=results)