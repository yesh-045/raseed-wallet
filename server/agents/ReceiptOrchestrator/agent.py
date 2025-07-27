from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from dotenv import load_dotenv
from .subagents.receipt_feedback.agent import receipt_feedback_agent
from .subagents.receipt_ingestion.agent import receipt_ingestion_agent
from .subagents.google_wallet.agent import google_wallet_agent



load_dotenv()

root_agent = LlmAgent(
    name="ReceiptOrchestrator",
    model="gemini-2.0-flash",
    description="Main agent responsible for orchestrating receipt processing: ingestion, feedback, and Google Wallet upload.",
    instruction="""
        "You are the central orchestrator for Project Raseed.\n"
        "Your job is to manage the receipt processing workflow:\n\n"
        "1. receipt_ingenstionUse receipt_ingestion_agent to handle initial receipt uploads and data extraction. Delegate to This agent Only when The image is given otherwise don't move to This agent\n  "
        "2. Use receipt_feedback_agent to process user feedback and correct any errors in the extracted data.\n"
        "3. Use google_wallet_agent as a tool to upload the finalized receipt data to Google Wallet.\n"
        "Do not try to process the receipts yourself. Delegate to the appropriate agent."
    """,
    sub_agents=[
        receipt_ingestion_agent,
        receipt_feedback_agent,
        google_wallet_agent
    ],
)