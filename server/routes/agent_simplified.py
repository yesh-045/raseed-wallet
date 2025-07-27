"""
Agent Routes for Raseed API
============================

This module provides a unified endpoint for the Raseed Chatbot Agent.
The agent intelligently handles all user queries through a single chat interface.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from auth_middleware import get_current_user_optional
import traceback
from datetime import datetime

# Import the new modular chatbot agent
from agents.chatbot import RaseedChatbotAgent

router = APIRouter()

# Initialize the agent (single instance for efficiency)
try:
    chatbot_agent = RaseedChatbotAgent()
    print("✅ Raseed Chatbot Agent successfully initialized for routes")
except Exception as e:
    print(f"❌ Failed to initialize Raseed Chatbot Agent: {str(e)}")
    chatbot_agent = None


class ChatMessage(BaseModel):
    message: str
    uid: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    uid: str
    timestamp: str
    error: Optional[str] = None


class AgentStatusResponse(BaseModel):
    status: str
    agent_available: bool
    tools_count: int
    version: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    chat_request: ChatMessage,
    current_user: Optional[str] = Depends(get_current_user_optional)
):
    """
    Chat with the Raseed AI Agent
    
    This is the main agentic endpoint that intelligently handles all user queries:
    - Financial analysis and insights
    - Spending pattern analysis
    - Budget recommendations
    - General financial advice
    - Receipt queries
    - Wallet and savings suggestions
    
    The agent determines what type of response is needed and routes to appropriate tools.
    
    Args:
        chat_request: Message and optional user ID
        current_user: Authenticated user from token (if available)
    
    Returns:
        ChatResponse with the agent's intelligent reply
    """
    try:
        # Use authenticated user ID or fallback to provided/default
        uid = current_user or chat_request.uid or "user1"
        
        print(f"🤖 Agent chat request from {uid}: '{chat_request.message}'")
        
        if not chatbot_agent:
            return ChatResponse(
                success=False,
                response="❌ Agent is currently unavailable. Please try again later.",
                uid=uid,
                timestamp=str(datetime.now()),
                error="Agent initialization failed"
            )
        
        # Process the query using our modular agent
        # The agent will intelligently determine what tools to use
        response_text = chatbot_agent.process_query(chat_request.message, uid)
        
        return ChatResponse(
            success=True,
            response=response_text,
            uid=uid,
            timestamp=str(datetime.now())
        )
        
    except Exception as e:
        error_msg = f"Agent processing error: {str(e)}"
        print(f"💥 {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        
        return ChatResponse(
            success=False,
            response="❌ I encountered an error processing your request. Please try again.",
            uid=chat_request.uid or current_user or "user1",
            timestamp=str(datetime.now()),
            error=error_msg
        )


@router.get("/status", response_model=AgentStatusResponse)
async def get_agent_status():
    """
    Get the current status of the Raseed Agent
    
    Returns:
        AgentStatusResponse with agent availability and details
    """
    try:
        from agents.chatbot import __version__
        
        return AgentStatusResponse(
            status="healthy" if chatbot_agent else "unavailable",
            agent_available=chatbot_agent is not None,
            tools_count=4 if chatbot_agent else 0,  # FinancialData, Insights, Recommendations, QueryClassifier
            version=__version__
        )
        
    except Exception as e:
        print(f"Error getting agent status: {str(e)}")
        return AgentStatusResponse(
            status="error",
            agent_available=False,
            tools_count=0,
            version="unknown"
        )
