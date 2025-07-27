

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json

from .config import ChatbotConfig


class DatabaseConnectionTool:
    """Tool for managing Firebase database connections"""
    
    def __init__(self):
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase connection"""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            self.db = firestore.client()
        except ValueError:
            # Initialize Firebase if not already done
            cred = credentials.Certificate(ChatbotConfig.get_firebase_credentials_path())
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
    
    def get_client(self):
        """Get Firestore client"""
        return self.db


class FinancialDataTool:
    """Tool for retrieving and processing financial data"""
    
    def __init__(self):
        self.db_tool = DatabaseConnectionTool()
        self.db = self.db_tool.get_client()
    
    def get_user_profile(self, uid: str) -> Optional[Dict]:
        """
        Get user profile data
        
        Args:
            uid: User ID
            
        Returns:
            User profile dictionary or None
        """
        print(f"📋 Fetching user profile for: {uid}")
        
        try:
            user_docs = self.db.collection(ChatbotConfig.USERS_COLLECTION).where(
                filter=FieldFilter('uid', '==', uid)
            ).limit(1).get()
            
            if user_docs:
                profile = user_docs[0].to_dict()
                profile["_doc_id"] = user_docs[0].id
                print(f"   ✅ Profile found: {profile.get('name', 'Unknown')}")
                return profile
            else:
                print(f"   ❌ No profile found")
                return None
                
        except Exception as e:
            print(f"   ❌ Error fetching profile: {str(e)}")
            return None
    
    def get_receipts(self, uid: str, data_type: str = "comprehensive") -> List[Dict]:
        """
        Get user receipts based on data type
        
        Args:
            uid: User ID
            data_type: "recent", "comprehensive", or "all"
            
        Returns:
            List of receipt dictionaries
        """
        print(f"🧾 Fetching receipts for: {uid} (type: {data_type})")
        
        try:
            query = self.db.collection(ChatbotConfig.RECEIPTS_COLLECTION).where(
                filter=FieldFilter('uid', '==', uid)
            )
            
            if data_type == "recent":
                query = query.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(
                    ChatbotConfig.MAX_RECEIPTS_RECENT
                )
            elif data_type == "comprehensive":
                query = query.limit(ChatbotConfig.MAX_RECEIPTS_COMPREHENSIVE)
            
            docs = query.get()
            
            receipts = []
            for doc in docs:
                receipt_data = doc.to_dict()
                receipt_data['_doc_id'] = doc.id
                receipts.append(receipt_data)
            
            print(f"   ✅ Found {len(receipts)} receipts")
            return receipts
            
        except Exception as e:
            print(f"   ❌ Error fetching receipts: {str(e)}")
            return []
    
    def get_financial_data(self, uid: str, data_type: str = "comprehensive") -> Dict:
        """
        Get comprehensive financial data for a user
        
        Args:
            uid: User ID
            data_type: Type of data to retrieve
            
        Returns:
            Dictionary containing user profile, receipts, and metadata
        """
        print(f"🔍 Starting comprehensive data query for: {uid}")
        
        result = {
            "user_profile": None,
            "receipts": [],
            "metadata": {
                "uid": uid,
                "query_time": datetime.now().isoformat(),
                "data_type": data_type,
                "total_receipts": 0,
                "total_spent": 0.0
            }
        }
        
        # Get user profile
        if data_type in ["profile", "comprehensive"]:
            result["user_profile"] = self.get_user_profile(uid)
        
        # Get receipts
        if data_type in ["receipts", "recent", "comprehensive"]:
            result["receipts"] = self.get_receipts(uid, data_type)
        
        # Update metadata
        result["metadata"]["total_receipts"] = len(result["receipts"])
        result["metadata"]["total_spent"] = sum(
            r.get('total_amount', 0) for r in result["receipts"]
        )
        
        print(f"💾 Data summary: {result['metadata']['total_receipts']} receipts, "
              f"${result['metadata']['total_spent']:.2f} total")
        
        return result


class InsightCalculatorTool:
    """Tool for calculating financial insights from receipt data"""
    
    @staticmethod
    def calculate_spending_summary(receipts: List[Dict]) -> Dict:
        """Calculate basic spending summary"""
        if not receipts:
            return {}
        
        total_spent = sum(r.get('total_amount', 0) for r in receipts)
        
        # Get valid timestamps for date range
        valid_timestamps = [r.get('timestamp') for r in receipts if r.get('timestamp')]
        
        date_range = {}
        if valid_timestamps:
            try:
                date_range = {
                    "oldest": min(valid_timestamps),
                    "newest": max(valid_timestamps)
                }
            except Exception as e:
                print(f"Warning: Could not calculate date range: {str(e)}")
                date_range = {"oldest": None, "newest": None}
        
        return {
            "total_spent": total_spent,
            "average_transaction": total_spent / len(receipts),
            "transaction_count": len(receipts),
            "date_range": date_range
        }
    
    @staticmethod
    def calculate_category_breakdown(receipts: List[Dict]) -> Dict:
        """Calculate spending breakdown by category"""
        category_totals = {}
        
        for receipt in receipts:
            gemini_data = receipt.get('gemini_inference', {})
            categories = gemini_data.get('category_spend', {})
            
            for category, amount in categories.items():
                category_totals[category] = category_totals.get(category, 0) + amount
        
        return category_totals
    
    @staticmethod
    def calculate_spending_behavior(receipts: List[Dict]) -> Dict:
        """Calculate spending behavior metrics"""
        behavior = {
            "overspending_incidents": 0,
            "above_market_purchases": 0,
            "essential_spend_pct": 0,
            "non_essential_spend_pct": 0
        }
        
        total_amount = 0
        essential_amount = 0
        
        for receipt in receipts:
            amount = receipt.get('total_amount', 0)
            total_amount += amount
            
            if receipt.get('overspent', False):
                behavior["overspending_incidents"] += 1
            
            behavior["above_market_purchases"] += receipt.get('above_market_items', 0)
            
            # Essential vs non-essential analysis
            gemini_data = receipt.get('gemini_inference', {})
            need_want = gemini_data.get('need_vs_want_split', {})
            essential_pct = need_want.get('essential', 50) / 100
            essential_amount += amount * essential_pct
        
        if total_amount > 0:
            behavior["essential_spend_pct"] = (essential_amount / total_amount) * 100
            behavior["non_essential_spend_pct"] = 100 - behavior["essential_spend_pct"]
        
        return behavior
    
    @staticmethod
    def calculate_top_stores(receipts: List[Dict]) -> Dict:
        """Calculate spending by store"""
        store_totals = {}
        
        for receipt in receipts:
            store = receipt.get('store', 'Unknown')
            amount = receipt.get('total_amount', 0)
            store_totals[store] = store_totals.get(store, 0) + amount
        
        # Sort by amount spent
        return dict(sorted(store_totals.items(), key=lambda x: x[1], reverse=True))
    
    @staticmethod
    def calculate_budget_analysis(receipts: List[Dict], user_profile: Optional[Dict]) -> Dict:
        """Calculate budget-related metrics"""
        if not user_profile or not user_profile.get('budget_monthly'):
            return {}
        
        budget = user_profile['budget_monthly']
        total_spent = sum(r.get('total_amount', 0) for r in receipts)
        
        return {
            "monthly_budget": budget,
            "spent_vs_budget_pct": (total_spent / budget) * 100 if budget > 0 else 0,
            "remaining_budget": budget - total_spent,
            "is_over_budget": total_spent > budget,
            "days_until_budget_reset": 30  # Simplified - could be calculated based on actual dates
        }
    
    def calculate_comprehensive_insights(self, receipts: List[Dict], user_profile: Optional[Dict] = None) -> Dict:
        """Calculate all financial insights"""
        if not receipts:
            return {}
        
        return {
            "spending_summary": self.calculate_spending_summary(receipts),
            "category_breakdown": self.calculate_category_breakdown(receipts),
            "spending_behavior": self.calculate_spending_behavior(receipts),
            "top_stores": self.calculate_top_stores(receipts),
            "budget_analysis": self.calculate_budget_analysis(receipts, user_profile)
        }


class RecommendationTool:
    """Tool for generating financial recommendations"""
    
    @staticmethod
    def generate_savings_recommendations(insights: Dict) -> List[str]:
        """Generate savings recommendations based on insights"""
        recommendations = []
        
        # Budget-based recommendations
        budget_analysis = insights.get("budget_analysis", {})
        if budget_analysis.get("is_over_budget"):
            overage = budget_analysis.get("spent_vs_budget_pct", 0) - 100
            recommendations.append(
                f"💡 You're {overage:.1f}% over budget this month. Consider reviewing non-essential purchases."
            )
        
        # Category-based recommendations
        category_breakdown = insights.get("category_breakdown", {})
        if category_breakdown:
            top_category = max(category_breakdown.items(), key=lambda x: x[1])
            recommendations.append(
                f"📊 Your highest spending category is {top_category[0]} (${top_category[1]:.2f}). "
                f"Look for ways to optimize this area."
            )
        
        # Behavior-based recommendations
        behavior = insights.get("spending_behavior", {})
        if behavior.get("non_essential_spend_pct", 0) > 40:
            recommendations.append(
                f"🎯 {behavior['non_essential_spend_pct']:.1f}% of your spending is on non-essentials. "
                f"Consider reducing this to improve your financial health."
            )
        
        if behavior.get("overspending_incidents", 0) > 0:
            recommendations.append(
                f"⚠️ You've had {behavior['overspending_incidents']} overspending incidents. "
                f"Try setting purchase limits or waiting 24 hours before buying."
            )
        
        return recommendations
    
    @staticmethod
    def generate_budget_recommendations(insights: Dict, user_profile: Optional[Dict]) -> List[str]:
        """Generate budget-related recommendations"""
        recommendations = []
        
        if not user_profile or not user_profile.get('budget_monthly'):
            recommendations.append(
                "📝 Set a monthly budget to better track your spending and financial goals."
            )
            return recommendations
        
        budget_analysis = insights.get("budget_analysis", {})
        remaining_pct = (budget_analysis.get("remaining_budget", 0) / 
                        budget_analysis.get("monthly_budget", 1)) * 100
        
        if remaining_pct < 10:
            recommendations.append(
                "🚨 You're running low on budget! Focus on essentials for the rest of the month."
            )
        elif remaining_pct > 50:
            recommendations.append(
                f"💰 Great job! You have {remaining_pct:.1f}% of your budget remaining. "
                f"Consider saving the extra or investing in your goals."
            )
        
        return recommendations


class QueryClassifierTool:
    """Tool for classifying user queries"""
    
    DATA_KEYWORDS = [
        'spent', 'spending', 'purchases', 'bought', 'receipts', 'transactions',
        'budget', 'money', 'cost', 'price', 'amount', 'total', 'sum',
        'last month', 'this week', 'recent', 'history', 'analysis', 'breakdown',
        'my', 'i spent', 'i bought', 'show me', 'how much'
    ]
    
    GENERAL_KEYWORDS = [
        'how to', 'what is', 'tips', 'advice', 'help', 'explain',
        'definition', 'meaning', 'guide', 'tutorial', 'best practices'
    ]
    
    @classmethod
    def needs_financial_data(cls, query: str) -> bool:
        """
        Determine if a query needs access to financial data
        
        Args:
            query: User's query string
            
        Returns:
            True if financial data is needed, False otherwise
        """
        query_lower = query.lower()
        
        # Check for data-related keywords
        data_score = sum(1 for keyword in cls.DATA_KEYWORDS if keyword in query_lower)
        general_score = sum(1 for keyword in cls.GENERAL_KEYWORDS if keyword in query_lower)
        
        # If more data keywords than general keywords, likely needs data
        return data_score > general_score
    
    @classmethod
    def classify_data_type(cls, query: str) -> str:
        """
        Classify what type of data is needed
        
        Args:
            query: User's query string
            
        Returns:
            Data type: "recent", "profile", or "comprehensive"
        """
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['recent', 'latest', 'last few']):
            return "recent"
        elif any(word in query_lower for word in ['profile', 'budget', 'settings', 'info']):
            return "profile"
        else:
            return "comprehensive"
