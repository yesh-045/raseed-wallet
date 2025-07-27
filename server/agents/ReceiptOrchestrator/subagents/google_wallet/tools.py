import json
import os
import uuid
from typing import Dict, Any, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.service_account import Credentials
from google.auth import jwt, crypt


class WalletTool:
    """Tool for creating digital passes in Google Wallet.
    """

    def __init__(self, credentials_path: str = 'google_cloud_credentials.json'):
        """Initialize the wallet tool with Google credentials.
        
        Args:
            credentials_path: Path to Google service account JSON credentials file.
        """
        self.key_file_path = os.path.join(os.path.dirname(__file__), credentials_path)
        self.issuer_id = os.getenv('GOOGLE_WALLET_ISSUER_ID', '3388000000022973891')
        self.credentials = None
        self.client = None
        self._authenticate()
    
    def _authenticate(self) -> bool:
        """Authenticate with Google Wallet API."""
        try:
            self.credentials = Credentials.from_service_account_file(
                self.key_file_path,
                scopes=['https://www.googleapis.com/auth/wallet_object.issuer'])
            self.client = build('walletobjects', 'v1', credentials=self.credentials)
            return True
        except Exception as e:
            print(f"Authentication failed: {str(e)}")
            return False

    def is_ready(self) -> bool:
        return self.credentials is not None and self.client is not None

    def create_pass(self, 
                   title: str,header: str,description: str,
                   barcode_value: str,background_color: str = "#4285f4",
                   hero_image_url: Optional[str] = None,
                   logo_image_url: Optional[str] = None,
                   app_link_url: Optional[str] = None) -> Dict[str, Any]:
        """Create a Google Wallet pass.
            
        Returns:
            Dict containing:
                'success': Boolean indicating success
                'save_link': Link to save the pass (if successful)
                'error': Error message (if unsuccessful)
        """
        if not self.is_ready():
            return {
                'success': False,
                'error': 'Tool not authenticated with Google Wallet API'
            }
            
        try:
            # Generate unique suffixes
            class_suffix = f"raseed_generic_pass"
            object_suffix = f"object_{uuid.uuid4().hex[:8]}"
            
            # Create class and object
            class_id = self._create_class(class_suffix)
            save_link = self._create_object( 
                class_suffix, 
                object_suffix,
                title,
                header,
                description, 
                barcode_value,
                background_color,
                hero_image_url,
                logo_image_url,
                app_link_url
            )
            
            return {
                'success': True,
                'save_link': save_link,
                'class_id': class_id,
                'object_id': f'{self.issuer_id}.{object_suffix}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _create_class(self,class_suffix: str) -> str:
        """Create a wallet class (internal method).

        Args:
            issuer_id: The issuer ID for this request.
            class_suffix: Unique ID suffix for this pass class.

        Returns:
            The pass class ID
        """
        class_id = f'{self.issuer_id}.{class_suffix}'
        
        # Check if class exists
        try:
            self.client.genericclass().get(resourceId=class_id).execute()
            return class_id
        except HttpError as e:
            if e.status_code != 404:
                raise Exception(f"Error checking class: {str(e)}")
        
        # Create new class
        new_class = {'id': class_id}
        self.client.genericclass().insert(body=new_class).execute()
        return class_id

    def _create_object(self,  
                      class_suffix: str,
                      object_suffix: str, 
                      title: str, 
                      header: str,
                      description: str,
                      barcode_value: str, 
                      background_color: str,
                      hero_image_url: Optional[str] = None,
                      logo_image_url: Optional[str] = None,
                      app_link_url: Optional[str] = None) -> str:
        """Create a wallet object and return save link (internal method)."""
        object_id = f'{self.issuer_id}.{object_suffix}'
        class_id = f'{self.issuer_id}.{class_suffix}'
        
        # Set default images if not provided
        hero_image_url = hero_image_url or 'https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg'
        logo_image_url = logo_image_url or 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg'
        
        # Define class and object
        new_class = {'id': class_id}
        new_object = {
            'id': object_id,
            'classId': class_id,
            'state': 'ACTIVE',
            'heroImage': {
                'sourceUri': {'uri': hero_image_url},
                'contentDescription': {
                    'defaultValue': {'language': 'en-US', 'value': 'Hero image'}
                }
            },
            'textModulesData': [{
                'header': 'Details',
                'body': description,
                'id': 'TEXT_MODULE_ID'
            }],
            'barcode': {
                'type': 'QR_CODE',
                'value': barcode_value
            },
            'cardTitle': {
                'defaultValue': {'language': 'en-US', 'value': title}
            },
            'header': {
                'defaultValue': {'language': 'en-US', 'value': header}
            },
            'hexBackgroundColor': background_color,
            'logo': {
                'sourceUri': {'uri': logo_image_url},
                'contentDescription': {
                    'defaultValue': {'language': 'en-US', 'value': 'Logo'}
                }
            }
        }
        
        # Add app link if provided
        if app_link_url:
            new_object["appLinkData"] = {
                "webAppLinkInfo": {
                    "appTarget": {
                        "targetUri": {"uri": app_link_url}
                    }
                },
                "displayText": {
                    "defaultValue": {"value": "Open App"}
                }
            }

        # Create JWT
        claims = {
            'iss': self.credentials.service_account_email,
            'aud': 'google',
            'origins': ['www.example.com'],
            'typ': 'savetowallet',
            'payload': {
                'genericClasses': [new_class],
                'genericObjects': [new_object]
            }
        }

        # Sign JWT and create save link
        signer = crypt.RSASigner.from_service_account_file(self.key_file_path)
        token = jwt.encode(signer, claims).decode('utf-8')
        return f'https://pay.google.com/gp/v/save/{token}'


import os

def main():
    """Test the WalletTool functionality by creating a sample pass."""
    
    # Set path to your Google credentials file - update this path as needed
    credentials_path = os.path.join(os.path.dirname(__file__), 'google_cloud_credentials.json')
    
    # Create the wallet tool instance
    print("Initializing WalletTool...")
    wallet_tool = WalletTool(credentials_path=credentials_path)
    
    # Check if the tool is ready
    if not wallet_tool.is_ready():
        print("ERROR: WalletTool failed to initialize properly.")
        return
    
    print("WalletTool initialized successfully!")
    
    # Test parameters - replace with your actual issuer ID
    test_params = {
        "title": "Test Receipt",
        "header": "Raseed Digital Receipt",
        "description": "Thank you for your purchase! This is a digital receipt created for testing purposes.",
        "barcode_value": "RECEIPT-" + "12345678",
        "background_color": "#4285f4",  # Google Blue
        # Optional parameters
        # "hero_image_url": "https://example.com/hero.jpg", 
        # "logo_image_url": "https://example.com/logo.png",
        # "app_link_url": "https://example.com/app"
    }
    
    # Create the pass
    print(f"Creating pass with title: {test_params['title']}...")
    result = wallet_tool.create_pass(**test_params)
    
    # Handle the result
    if result['success']:
        print("✅ Pass created successfully!")
        print(f"Save link: {result['save_link']}")
        print(f"Class ID: {result['class_id']}")
        print(f"Object ID: {result['object_id']}")
        
        # You can open this link in a browser to save the pass
        print("\nOpen this link in a browser to save the pass to Google Wallet:")
        print(result['save_link'])
    else:
        print("❌ Failed to create pass:")
        print(f"Error: {result['error']}")

if __name__ == "__main__":
    main()