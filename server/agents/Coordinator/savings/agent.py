from google.adk.agents import LlmAgent

root_agent = LlmAgent(
    name="SavingsAgent",
    model="gemini-2.0-flash",
    description="Provides suggestions on how to save money based on user purchases.",
    instruction=(
        "Given past purchases, provide savings tips. Identify subscriptions, suggest cheaper items, or budget ideas."
    )
)
