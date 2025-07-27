# server/firestore_service.py
# Enhanced Firestore service with Google Cloud OAuth support

import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from google.cloud import firestore as gcp_firestore
from google.oauth2 import service_account




class FirestoreService:
    def __init__(self):
        # Initialize Firebase Admin SDK with service account
        if not firebase_admin._apps:
            service_account_path = os.path.join(os.path.dirname(__file__), 'serviceAccount.json')
            
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin initialized with service account")
            else:
                # Fallback to default credentials for Google Cloud
                try:
                    firebase_admin.initialize_app()
                    print("Firebase Admin initialized with default credentials")
                except Exception as e:
                    print(f"Failed to initialize Firebase Admin: {e}")
                    raise
        
        # Initialize Firestore client
        self.db = firestore.client()
        
        # Also initialize direct Google Cloud Firestore client for advanced operations
        try:
            if os.path.exists(os.path.join(os.path.dirname(__file__), 'serviceAccount.json')):
                credentials_info = service_account.Credentials.from_service_account_file(
                    os.path.join(os.path.dirname(__file__), 'serviceAccount.json')
                )
                self.gcp_db = gcp_firestore.Client(credentials=credentials_info)
            else:
                self.gcp_db = gcp_firestore.Client()  # Use default credentials
            
            print("Google Cloud Firestore client initialized")
        except Exception as e:
            print(f"Warning: Could not initialize GCP Firestore client: {e}")
            self.gcp_db = None
    
    def verify_firebase_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return decoded token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Error verifying Firebase token: {e}")
            return None
    
    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user profile by UID"""
        try:
            doc_ref = self.db.collection('users').document(uid)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error fetching user {uid}: {e}")
            return None
    
    def create_or_update_user(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create or update user profile"""
        try:
            doc_ref = self.db.collection('users').document(uid)
            
            # Add timestamps
            user_data['updated_at'] = datetime.now()
            if not doc_ref.get().exists:
                user_data['created_at'] = datetime.now()
            
            doc_ref.set(user_data, merge=True)
            return True
        except Exception as e:
            print(f"Error updating user {uid}: {e}")
            return False
    
    def get_user_receipts(self, uid: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get receipts for a specific user"""
        try:
            receipts_ref = self.db.collection('receipts')
            # Try both uid and user_id fields for compatibility
            query = receipts_ref.where('user_id', '==', uid).limit(limit)
            docs = query.stream()
            
            receipts = []
            for doc in docs:
                receipt_data = doc.to_dict()
                receipt_data['id'] = doc.id
                receipts.append(receipt_data)
            
            # If no results with user_id, try uid field
            if not receipts:
                query = receipts_ref.where('uid', '==', uid).limit(limit)
                docs = query.stream()
                
                for doc in docs:
                    receipt_data = doc.to_dict()
                    receipt_data['id'] = doc.id
                    receipts.append(receipt_data)
            
            return receipts
        except Exception as e:
            print(f"Error fetching receipts for user {uid}: {e}")
            return []
    
    def get_user_receipts_by_date_range(self, uid: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get receipts within a date range - simplified to avoid index requirements"""
        try:
            # First get all receipts for the user
            receipts_ref = self.db.collection('receipts')
            # Try user_id first, then uid for compatibility
            query = receipts_ref.where('user_id', '==', uid)
            docs = query.stream()
            
            receipts = []
            for doc in docs:
                receipt_data = doc.to_dict()
                receipt_data['id'] = doc.id
                
                # Filter by date in Python to avoid composite index requirement
                purchase_date = receipt_data.get('date') or receipt_data.get('purchase_date')
                if purchase_date:
                    # Handle different date formats and timezone issues
                    if hasattr(purchase_date, 'timestamp'):
                        purchase_datetime = purchase_date.replace(tzinfo=None) if purchase_date.tzinfo else purchase_date
                    else:
                        # Try to parse string dates
                        try:
                            purchase_datetime = datetime.fromisoformat(str(purchase_date))
                            if purchase_datetime.tzinfo:
                                purchase_datetime = purchase_datetime.replace(tzinfo=None)
                        except:
                            continue
                    
                    # Ensure start_date and end_date are timezone-naive
                    start_naive = start_date.replace(tzinfo=None) if start_date.tzinfo else start_date
                    end_naive = end_date.replace(tzinfo=None) if end_date.tzinfo else end_date
                    
                    if start_naive <= purchase_datetime <= end_naive:
                        receipts.append(receipt_data)
                else:
                    # Include receipts without date (for testing)
                    receipts.append(receipt_data)
            
            # If no results with user_id, try uid field
            if not receipts:
                query = receipts_ref.where('uid', '==', uid)
                docs = query.stream()
                
                for doc in docs:
                    receipt_data = doc.to_dict()
                    receipt_data['id'] = doc.id
                    
                    purchase_date = receipt_data.get('date') or receipt_data.get('purchase_date')
                    if purchase_date:
                        if hasattr(purchase_date, 'timestamp'):
                            purchase_datetime = purchase_date.replace(tzinfo=None) if purchase_date.tzinfo else purchase_date
                        else:
                            try:
                                purchase_datetime = datetime.fromisoformat(str(purchase_date))
                                if purchase_datetime.tzinfo:
                                    purchase_datetime = purchase_datetime.replace(tzinfo=None)
                            except:
                                continue
                        
                        start_naive = start_date.replace(tzinfo=None) if start_date.tzinfo else start_date
                        end_naive = end_date.replace(tzinfo=None) if end_date.tzinfo else end_date
                        
                        if start_naive <= purchase_datetime <= end_naive:
                            receipts.append(receipt_data)
                    else:
                        receipts.append(receipt_data)
            
            return receipts
        except Exception as e:
            print(f"Error fetching receipts by date range for user {uid}: {e}")
            return []
    
    def store_insight_result(self, uid: str, insight_type: str, result: Dict[str, Any]) -> bool:
        """Store insight analysis result"""
        try:
            insight_data = {
                'uid': uid,
                'insight_type': insight_type,
                'result': result,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            doc_ref = self.db.collection('insights').document(f"{uid}_{insight_type}")
            doc_ref.set(insight_data, merge=True)
            return True
        except Exception as e:
            print(f"Error storing insight {insight_type} for user {uid}: {e}")
            return False
    
    def get_insight_result(self, uid: str, insight_type: str) -> Optional[Dict[str, Any]]:
        """Get cached insight result"""
        try:
            doc_ref = self.db.collection('insights').document(f"{uid}_{insight_type}")
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error fetching insight {insight_type} for user {uid}: {e}")
            return None

# Global instance
firestore_service = FirestoreService()


