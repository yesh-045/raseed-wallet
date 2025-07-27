"""
Chatbot Configuration
====================

Configuration settings for the Raseed Chatbot Agent
"""

import os
from typing import Optional


class ChatbotConfig:
    """Configuration class for Raseed Chatbot"""
    
    # Gemini API Configuration
    GEMINI_API_KEY: str = "AIzaSyBPKHI8sV2ErtPEDwLVXx-EUjlWKpX8se0"
    GEMINI_MODEL: str = "models/gemini-1.5-flash"
    
    # Firebase Configuration
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "serviceAccount.json"
    
    # Database Collections
    USERS_COLLECTION: str = "users"
    RECEIPTS_COLLECTION: str = "receipts"
    
    # Response Configuration
    MAX_RESPONSE_LENGTH: int = 2000
    MAX_RECEIPTS_RECENT: int = 10
    MAX_RECEIPTS_COMPREHENSIVE: int = 100
    
    # System Prompt
    SYSTEM_PROMPT: str = """
You are *Raseed*, an AI-powered personal finance and receipt assistant. Your role is to help users track expenses, analyze spending habits, and offer intelligent financial suggestions.

*DATABASE SCHEMA:*
- *Users*: uid, name, email, preferred_currency, budget_monthly, fhs_score, behavior_summary, savings_pct
- *Receipts*: receipt_id, uid, timestamp, store, total_amount, overspent, non_essential_pct, gemini_inference, items[]

*Core Abilities:*
1. *Receipt Analysis* - Extract and analyze spending patterns
2. *Financial Insights* - Provide spending breakdowns and health assessments  
3. *Smart Recommendations* - Offer actionable money-saving advice
4. *Budget Tracking* - Monitor spending vs budget goals

*Response Guidelines:*
- Be conversational, helpful, and financially insightful
- Use actual data from the user's financial records
- Provide specific, actionable recommendations
- Focus on improving financial health

*Query Classification:*
For user queries, determine if you need database access:
- *NEED_DATA*: Queries about personal spending, receipts, budget status, financial analysis
- *GENERAL*: General finance tips, how-to questions, definitions that don't need personal data

Respond with either:
"NEED_DATA: [what specific data you need]" 
OR provide direct helpful response for general queries.
"""
    
    @classmethod
    def get_firebase_credentials_path(cls) -> str:
        """Get the full path to Firebase service account file"""
        return os.path.join(os.path.dirname(__file__), "..", "..", cls.FIREBASE_SERVICE_ACCOUNT_PATH)
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that all required configuration is present"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required")
        
        credentials_path = cls.get_firebase_credentials_path()
        if not os.path.exists(credentials_path):
            raise ValueError(f"Firebase credentials file not found: {credentials_path}")
        
        return True
