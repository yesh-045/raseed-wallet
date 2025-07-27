from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import ToolContext
from .tools import WalletTool
from typing import Dict
import json

def create_google_wallet_tool(tool_context: ToolContext) -> Dict:
    parsed_result_string = tool_context.state.get('parsed_receipt', None)
    parsed_result_string = parsed_result_string[7:-3]
    print(parsed_result_string)
    if not parsed_result_string:
        return {
            'success': False,
            'error': 'No parsed result found in tool context'
        }
    
    try:
        parsed_result = json.loads(parsed_result_string)
    except json.JSONDecodeError:
        return {
            'success': False,
            'error': 'Failed to decode parsed receipt JSON'
        }

    print(parsed_result)
    title = parsed_result.get('title', 'Receipt')
    header = parsed_result.get('header', 'Receipt Header')
    description = parsed_result.get('description', 'Receipt Description')
    barcode_value = parsed_result.get('barcode_value', '1234567890')
    background_color = parsed_result.get('background_color', '#4285f4')
    hero_image_url = parsed_result.get('hero_image_url', None)
    logo_image_url = parsed_result.get('logo_image_url', None)
    app_link_url = parsed_result.get('app_link_url', None)
    

    wallet_tool = WalletTool()

    try:
        response = wallet_tool.create_pass(title, header, description,
            barcode_value, background_color,hero_image_url,logo_image_url, app_link_url)
        return response
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


google_wallet_agent = LlmAgent(
    name= 'google_wallet',
    model='gemini-2.0-flash',
    description='Generates a Google Wallet pass for a receipt',
    instruction="""You are a Google Wallet pass generator. 
    You can use the 'create_google_wallet_tool' to generate a Google Wallet pass. 
    Here it uses The {parsed_receipt} and connects to The wallet api to generate a pass 
    It Returns a token ,link return that to the user
    return The response from the tool as a JSON object with 'success' and 'error' keys.""",
    tools  = [ create_google_wallet_tool ]
)


