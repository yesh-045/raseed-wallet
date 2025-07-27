from google.adk.agents import LlmAgent
# from Coordinator.receipt_ingestion.agent import root_agent as receipt_ingestion_agent
from Coordinator.spending_insight.agent import root_agent as spending_agent
from Coordinator.savings.agent import root_agent as savings_agent
from Coordinator.shopping_list.agent import root_agent as shopping_agent

root_agent = LlmAgent(
    name="Coordinator",
    model="gemini-2.0-flash",
    description="Main agent responsible for routing user queries to the correct agent (e.g., receipt help, finance, shopping).",
    instruction=(
        "You are the central dispatcher agent for Project Raseed.\n"
        "Your job is to route the user's query to the correct agent based on intent:\n\n"
        # "- Use `receipt_ingestion_agent` if the input relates to receipt uploads (e.g., 'here is a receipt', 'analyze this bill').\n"
        "- Use `spending_agent` for questions about expenses, budget breakdowns.\n"
        "- Use `savings_agent` for suggesting cost-saving opportunities based on past purchases.\n"
        "- Use `shopping_agent` for cooking or shopping-related questions like 'what should I buy to make dal?'.\n"
        "Do not try to answer the question yourself. Always delegate to the correct agent."
    ),
    sub_agents=[
        # receipt_ingestion_agent,
        # spending_agent,
        savings_agent,
        shopping_agent
    ]
)
