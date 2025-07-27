"""
Shared utilities for insight tools - enhanced with proper Firestore integration
"""
import os
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import firestore_service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from firestore_service import firestore_service

_model = None

def get_db():
    """Get Firestore service instance"""
    return firestore_service

def get_ai_model():
    """Get configured AI model"""
    global _model
    if _model is None:
        # Use environment variable for API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("models/gemini-2.0-flash")
    return _model

def fetch_user_receipts(user_id, days_back=180):
    """Fetch receipts for a user within specified time range"""
    try:
        cutoff_date = datetime.now() - timedelta(days=days_back)
        receipts = firestore_service.get_user_receipts_by_date_range(
            user_id, cutoff_date, datetime.now()
        )
        return receipts
    except Exception as e:
        print(f"Error fetching receipts: {e}")
        return []

def parse_timestamp(timestamp):
    """Parse various timestamp formats safely"""
    if not timestamp:
        return None
    try:
        if isinstance(timestamp, datetime):
            return timestamp.replace(tzinfo=None)
        return datetime.fromisoformat(str(timestamp).replace('Z', '+00:00')).replace(tzinfo=None)
    except:
        try:
            return datetime.strptime(str(timestamp)[:10], '%Y-%m-%d')
        except:
            return None

def safe_float(value, default=0.0):
    """Safely convert value to float"""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def generate_ai_insight(prompt, context_data):
    """Generate AI insight with error handling"""
    try:
        model = get_ai_model()
        
        # Limit context data to avoid token overflow
        if isinstance(context_data, list) and len(context_data) > 10:
            context_data = context_data[:10]
        
        full_prompt = f"{prompt}\n\nData: {context_data}"
        response = model.generate_content(full_prompt)
        return response.text if response.text else "No insight generated"
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}"

def cache_insight_result(user_id, insight_type, result):
    """Cache insight result to database"""
    try:
        return firestore_service.store_insight_result(user_id, insight_type, result)
    except Exception as e:
        print(f"Error caching insight: {e}")
        return False

def get_cached_insight(user_id, insight_type):
    """Get cached insight result"""
    try:
        return firestore_service.get_insight_result(user_id, insight_type)
    except Exception as e:
        print(f"Error retrieving cached insight: {e}")
        return None
