import json
import os
import uuid
from typing import Dict, Any, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.service_account import Credentials
from google.auth import jwt, crypt


class WalletTool:
    """Tool for creating digital passes in Google Wallet."""

    def __init__(self, credentials_path: str = 'serviceAccount.json'):
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
                scopes=['https://www.googleapis.com/auth/wallet_object.issuer']
            )
            self.client = build('walletobjects', 'v1', credentials=self.credentials)
            return True
        except Exception as e:
            print(f"Authentication failed: {str(e)}")
            return False

    def is_ready(self) -> bool:
        """Check if the tool is properly authenticated."""
        return self.credentials is not None and self.client is not None

    def create_receipt_pass(self, 
                           receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Wallet pass for a receipt.
        
        Args:
            receipt_data: Dictionary containing receipt information
            
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
            # Extract receipt information
            merchant_name = receipt_data.get('merchant_name', 'Unknown Merchant')
            total_amount = receipt_data.get('total_amount', '0.00')
            receipt_date = receipt_data.get('date', 'Unknown Date')
            receipt_id = receipt_data.get('receipt_id', str(uuid.uuid4())[:8])
            
            # Generate unique suffixes
            class_suffix = "raseed_receipt_pass"
            object_suffix = f"receipt_{receipt_id}_{uuid.uuid4().hex[:8]}"
            
            # Create class and object
            class_id = self._create_class(class_suffix)
            save_link = self._create_object(
                class_suffix,
                object_suffix,
                title=f"Receipt - {merchant_name}",
                header="Raseed Digital Receipt",
                description=f"Amount: ${total_amount}\nDate: {receipt_date}\nMerchant: {merchant_name}",
                barcode_value=f"RECEIPT-{receipt_id}",
                background_color="#4285f4",
                hero_image_url=receipt_data.get('hero_image_url'),
                logo_image_url="https://storage.googleapis.com/raseed-wallet/logo.png",
                app_link_url="https://raseed.app/receipts"
            )
            
            return {
                'success': True,
                'save_link': save_link,
                'class_id': class_id,
                'object_id': f'{self.issuer_id}.{object_suffix}',
                'receipt_id': receipt_id
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def create_custom_pass(self, 
                          title: str,
                          header: str,
                          description: str,
                          barcode_value: str,
                          background_color: str = "#4285f4",
                          hero_image_url: Optional[str] = None,
                          logo_image_url: Optional[str] = None,
                          app_link_url: Optional[str] = None) -> Dict[str, Any]:
        """Create a custom Google Wallet pass.
            
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
            class_suffix = "raseed_generic_pass"
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

    def _create_class(self, class_suffix: str) -> str:
        """Create a wallet class (internal method).

        Args:
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

        # Check if object exists
        try:
            self.client.genericobject().get(resourceId=object_id).execute()
            print(f"Object {object_id} already exists!")
        except HttpError as e:
            if e.status_code == 404:
                # Create new object
                self.client.genericobject().insert(body=new_object).execute()
            else:
                raise Exception(f"Error checking object: {str(e)}")

        # Create JWT for save link
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


def main():
    """Test the WalletTool functionality by creating a sample pass."""
    
    # Create the wallet tool instance
    print("Initializing WalletTool...")
    wallet_tool = WalletTool()
    
    # Check if the tool is ready
    if not wallet_tool.is_ready():
        print("ERROR: WalletTool failed to initialize properly.")
        return
    
    print("WalletTool initialized successfully!")
    
    # Test with receipt data
    test_receipt = {
        "merchant_name": "Test Store",
        "total_amount": "25.99",
        "date": "2025-07-27",
        "receipt_id": "RCP123456",
        "hero_image_url": "https://example.com/receipt-hero.jpg"
    }
    
    # Create the receipt pass
    print(f"Creating receipt pass for {test_receipt['merchant_name']}...")
    result = wallet_tool.create_receipt_pass(test_receipt)
    
    # Handle the result
    if result['success']:
        print("✅ Receipt pass created successfully!")
        print(f"Save link: {result['save_link']}")
        print(f"Class ID: {result['class_id']}")
        print(f"Object ID: {result['object_id']}")
        
        print("\nOpen this link in a browser to save the pass to Google Wallet:")
        print(result['save_link'])
    else:
        print("❌ Failed to create receipt pass:")
        print(f"Error: {result['error']}")


if __name__ == "__main__":
    main()
