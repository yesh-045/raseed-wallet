from google.adk.agents import LlmAgent, SequentialAgent
from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool

class Item(BaseModel):
    item_name: str = Field(..., description="Name of the item")
    category: str = Field(..., description="Category of the item")
    brand: str = Field(..., description="Brand name")
    quantity: float = Field(..., description="Units purchased")
    unit_price: float = Field(..., description="Price per unit")
    tax: float = Field(..., description="Tax applied")
    description: Optional[str] = Field(None, description="Optional description of the item")

class Receipt(BaseModel):
    timestamp: datetime = Field(
        ..., description="ISO 8601 format timestamp of purchase"
    ),
    store: str = Field(..., description="Name of the store")
    items: List[Item] = Field(..., description="Detailed list of purchased items")
    location: str = Field(..., description="Location of the store")
    total_amount: float = Field(..., description="Total bill amount")
    



import requests
import base64
from google.adk.tools import FunctionTool

def download_and_encode_image(image_url: str) -> Dict:
    """
    Downloads an image from URL and returns Base64 encoded string.
    This will be called before invoking the agent.
    """
    try:
        resp = requests.get(image_url, timeout=15)
        b64 = base64.b64encode(resp.content).decode('utf-8')
        return {"status" : True, "input_data" : b64}
    except Exception as e:
        raise Exception(f"Failed to download image: {str(e)}")


instruction_text = """
You are a specialized AI assistant for high-precision receipt processing. You will receive a Base64-encoded image of a receipt and must extract structured data from it.

**CRITICAL: You must carefully examine and read the ACTUAL text visible in the provided image. Do NOT generate fictional or example data.**

Your task:
1. **CAREFULLY ANALYZE** the provided receipt image using OCR
2. **READ ALL VISIBLE TEXT** from the actual image - store names, item names, prices, dates, etc.
3. **EXTRACT ONLY REAL DATA** that you can actually see in the image
4. **DO NOT MAKE UP OR GUESS** any information that is not clearly visible
5. Return ONLY the JSON object below with the ACTUAL data from the image

**IMPORTANT: If you cannot clearly read specific information from the image (like a date, store name, or price), use `cant_read` for those fields. DO NOT invent data.**

*Required JSON Output Schema:*
{
  "timestamp": "string (ISO 8601 format: YYYY-MM-DDTHH:MM:SS) - ONLY if clearly visible on receipt",
  "store": "string - ONLY the actual store name visible on the receipt", 
  "location": "string - ONLY if address is clearly visible on receipt",
  "total_amount": "float - ONLY the actual total amount visible on receipt",
  "items": [
    {
      "item_name": "string - EXACT item name as it appears on receipt",
      "category": "string - Infer from item name, but be accurate",
      "brand": "string - ONLY if brand is clearly visible, otherwise null",
      "quantity": "float - Actual quantity from receipt, default 1.0 if not specified",
      "unit_price": "float - ACTUAL price visible on receipt",
      "tax": "float - ONLY if item-specific tax is visible, otherwise null"
    }
  ]
}

*Rules:*
- NEVER generate fake or example data like "Snickers, Pepsi, Doritos"
- ONLY extract information that is actually visible in the image
- Use `null` for any field where information is not clearly readable
- Categories should be logical based on the actual item names you see
- Response must be ONLY the JSON object with REAL data from the image
- No fake datas
"""


receipt_ingestion_agent = LlmAgent(
    name="receipt_ingestion",
    model="gemini-1.5-flash",
    description="Receipt parser OCR agent that processes Base64 image data directly",
    instruction=instruction_text,
    tools=[],  # No tools needed
    output_key="parsed_receipt"
)


# receipt_refinement_agent = LlmAgent(
#     name='receipt_refinement',
#     model='gemini-2.0-flash',
#     description='Agent for refining receipt data',
#     instruction = """
#     You are a data refinement agent.Your primary function is to process a structured JSON object representing a parsed receipt, enrich it with external data.

# *Your Goal:* Take the input JSON from the state, {parsed_receipt}, and for each item, use the google_search tool to find and add a descriptive summary and a more accurate category.

# *Core Instructions:*

# 1.  *Receive Input:* You will be given a JSON object named {parsed_receipt} which contains the extracted data from a receipt.

# 2.  *Iterate Through Items:* Process each JSON object within the items array one by one.

# 3.  *Perform Google Search:* For each item, construct a search query using its item_name and brand (if available). For example, for an item named "Organic Blueberries" with brand "Driscoll's", a good query would be "Driscoll's Organic Blueberries". Use the google_search tool to get information.

# 4.  *Enrich Item Data:*
#     *   **category:** Based on the search results, validate or refine the item's category. If the original category was generic (e.g., "Groceries") or null, update it to be more specific (e.g., "Produce", "Snacks", "Beverage"). If no better category can be determined, retain the original.
#     *   **description:** Add a new field to each item called description. This field must contain a concise, 10-15 word summary of the item based on the information found in your search. If no relevant information is found, the value for description MUST be null.
# 5. ** Store The refined data in The same {parsed_receipt} JSON object format.
# ---
#     """,
#     tools = [google_search],
#     output_key="parsed_receipt",
# )

