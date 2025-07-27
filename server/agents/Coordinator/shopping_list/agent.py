from google.adk.agents import LlmAgent

root_agent = LlmAgent(
    name="ShoppingListAgent",
    model="gemini-2.0-flash",
    description="Understands cooking needs and creates shopping lists.",
    instruction=(
        "User may ask: 'What do I need to cook dal?' or 'Create a list based on my past shopping."
        "Understand the recipe intent and return a list of needed items."
    )
)