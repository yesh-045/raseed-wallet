"""
Raseed Chatbot Agent
===================

Main agent controller for the Raseed Chatbot system
"""

import google.generativeai as genai
from datetime import datetime
from typing import Dict, List, Optional
import json

from .config import ChatbotConfig
from .tools import (
    FinancialDataTool,
    InsightCalculatorTool,
    RecommendationTool,
    QueryClassifierTool
)


class RaseedChatbotAgent:
    """
    Main Raseed Chatbot Agent
    
    This agent coordinates between various tools to provide intelligent
    financial assistance and receipt analysis.
    """
    
    def __init__(self):
        """Initialize the Raseed Chatbot Agent"""
        self.config = ChatbotConfig()
        self.config.validate_config()
        
        # Initialize Gemini AI
        genai.configure(api_key=self.config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.config.GEMINI_MODEL)
        
        # Initialize tools
        self.financial_data_tool = FinancialDataTool()
        self.insight_calculator = InsightCalculatorTool()
        self.recommendation_tool = RecommendationTool()
        self.query_classifier = QueryClassifierTool()
        
        print(f"🤖 Raseed Chatbot Agent initialized")
        print(f"   └─ Model: {self.config.GEMINI_MODEL}")
        print(f"   └─ Tools: Financial Data, Insights, Recommendations, Query Classifier")
    
    def process_query(self, user_message: str, uid: str) -> str:
        """
        Process a user query and return an appropriate response
        
        Args:
            user_message: The user's input message
            uid: User ID for data access
            
        Returns:
            AI-generated response string
        """
        try:
            print(f"\n🎯 Processing query from user {uid}: '{user_message}'")
            
            # Step 1: Classify the query using our local classifier
            needs_data = self.query_classifier.needs_financial_data(user_message)
            
            if needs_data:
                return self._handle_data_query(user_message, uid)
            else:
                return self._handle_general_query(user_message)
                
        except Exception as e:
            error_msg = f"❌ I encountered an error processing your request: {str(e)}. Please try again or rephrase your question."
            print(f"💥 Error in process_query: {str(e)}")
            return error_msg
    
    def _handle_data_query(self, user_message: str, uid: str) -> str:
        """Handle queries that require financial data access"""
        print(f"📊 Handling data query...")
        
        # Determine data type needed
        data_type = self.query_classifier.classify_data_type(user_message)
        print(f"   └─ Data type required: {data_type}")
        
        # Get financial data using our tool
        financial_data = self.financial_data_tool.get_financial_data(uid, data_type)
        
        if not financial_data["receipts"] and data_type != "profile":
            return "📭 I don't see any receipt data for your account yet. Start by adding some receipts and I'll help you analyze your spending patterns!"
        
        # Calculate insights using our tool
        insights = {}
        if financial_data["receipts"]:
            insights = self.insight_calculator.calculate_comprehensive_insights(
                financial_data["receipts"], 
                financial_data["user_profile"]
            )
            financial_data["insights"] = insights
        
        # Generate recommendations using our tool
        recommendations = []
        if insights:
            recommendations.extend(
                self.recommendation_tool.generate_savings_recommendations(insights)
            )
            recommendations.extend(
                self.recommendation_tool.generate_budget_recommendations(
                    insights, financial_data["user_profile"]
                )
            )
        
        print(f"🧠 Generating AI response with comprehensive data...")
        print(f"   └─ Receipts: {len(financial_data['receipts'])}")
        print(f"   └─ Insights: {len(insights)} categories")
        print(f"   └─ Recommendations: {len(recommendations)}")
        
        # Create the analysis prompt with all the data
        analysis_prompt = f"""{self.config.SYSTEM_PROMPT}

User asked: "{user_message}"

Here's the user's financial data and analysis:
```json
{json.dumps(financial_data, indent=2, default=str)}
```

Generated Recommendations:
{chr(10).join(recommendations) if recommendations else "No specific recommendations generated."}

As Raseed, provide a comprehensive, conversational response that:

1. **Directly answers** their specific question using the actual data
2. **Provides key insights** from their spending patterns  
3. **Offers actionable recommendations** to improve their financial health
4. **Uses specific numbers** from their data (amounts, percentages, trends)
5. **Maintains a helpful, friendly tone** like a personal finance advisor

Focus on being practical and actionable rather than just descriptive.
If recommendations were provided, incorporate them naturally into your response.
"""
        
        response = self.model.generate_content(analysis_prompt)
        print(f"✅ AI response generated ({len(response.text)} characters)")
        
        return response.text
    
    def _handle_general_query(self, user_message: str) -> str:
        """Handle general finance queries that don't need personal data"""
        print(f"💬 Handling general query...")
        
        general_prompt = f"""{self.config.SYSTEM_PROMPT}

User asked: "{user_message}"

This is a general finance question that doesn't require personal data access.
As Raseed, provide helpful, actionable advice about personal finance, budgeting, 
saving money, or financial best practices.

Keep your response:
- Practical and actionable
- Easy to understand
- Specific with examples where helpful
- Encouraging and supportive
- Focused on financial health improvement

Provide your response directly without any prefixes.
"""
        
        response = self.model.generate_content(general_prompt)
        print(f"✅ General response generated ({len(response.text)} characters)")
        
        return response.text
    
    def get_user_financial_summary(self, uid: str) -> Dict:
        """
        Get a summary of user's financial data (for API endpoints)
        
        Args:
            uid: User ID
            
        Returns:
            Dictionary with financial summary
        """
        print(f"📋 Generating financial summary for: {uid}")
        
        financial_data = self.financial_data_tool.get_financial_data(uid, "comprehensive")
        
        if financial_data["receipts"]:
            insights = self.insight_calculator.calculate_comprehensive_insights(
                financial_data["receipts"], 
                financial_data["user_profile"]
            )
            financial_data["insights"] = insights
        
        return financial_data
    
    def analyze_spending_pattern(self, uid: str, category: Optional[str] = None) -> str:
        """
        Analyze spending patterns for a specific category or overall
        
        Args:
            uid: User ID
            category: Optional category to focus on
            
        Returns:
            Analysis text
        """
        query = f"Analyze my spending patterns"
        if category:
            query += f" for {category}"
        
        return self.process_query(query, uid)
    
    def get_budget_status(self, uid: str) -> str:
        """
        Get current budget status
        
        Args:
            uid: User ID
            
        Returns:
            Budget status text
        """
        return self.process_query("What's my current budget status?", uid)
    
    def get_savings_recommendations(self, uid: str) -> str:
        """
        Get personalized savings recommendations
        
        Args:
            uid: User ID
            
        Returns:
            Recommendations text
        """
        return self.process_query("Give me recommendations to save money based on my spending", uid)


# Legacy function for backward compatibility
def get_raseed_response(uid: str, message: str) -> str:
    """
    Legacy function for backward compatibility
    
    Args:
        uid: User ID for database queries
        message: User's input message
        
    Returns:
        String response from Raseed
    """
    agent = RaseedChatbotAgent()
    return agent.process_query(message, uid)
